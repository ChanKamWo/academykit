namespace Lingtren.Infrastructure.Services
{
    using Lingtren.Application.Common.Dtos;
    using Lingtren.Application.Common.Exceptions;
    using Lingtren.Application.Common.Interfaces;
    using Lingtren.Application.Common.Models.RequestModels;
    using Lingtren.Domain.Entities;
    using Lingtren.Domain.Enums;
    using Lingtren.Infrastructure.Common;
    using Lingtren.Infrastructure.Helpers;
    using LinqKit;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore.Query;
    using Microsoft.Extensions.Logging;
    using System.Linq.Expressions;

    public class LessonService : BaseGenericService<Lesson, LessonBaseSearchCriteria>, ILessonService
    {
        public LessonService(
            IUnitOfWork unitOfWork,
            ILogger<LessonService> logger) : base(unitOfWork, logger)
        {
        }

        #region Protected Region

        /// <summary>
        /// Applies filters to the given query.
        /// </summary>
        /// <param name="predicate">The predicate.</param>
        /// <param name="criteria">The search criteria.</param>
        /// <returns>The updated predicate with applied filters.</returns>
        protected override Expression<Func<Lesson, bool>> ConstructQueryConditions(Expression<Func<Lesson, bool>> predicate, LessonBaseSearchCriteria criteria)
        {
            CommonHelper.ValidateArgumentNotNullOrEmpty(criteria.CourseIdentity, nameof(criteria.CourseIdentity));
            var course = ValidateAndGetCourse(criteria.CurrentUserId, criteria.CourseIdentity).Result;
            predicate = predicate.And(p => p.CourseId == course.Id);
            return predicate;
        }

        /// <summary>
        /// Includes the navigation properties loading for the entity.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <returns>The updated query.</returns>
        protected override IIncludableQueryable<Lesson, object> IncludeNavigationProperties(IQueryable<Lesson> query)
        {
            return query.Include(x => x.User);
        }

        /// <summary>
        /// If entity needs to support the get by slug or id then has to override this method.
        /// </summary>
        /// <param name="slug">The slug</param>
        /// <returns>The expression to filter by slug or slug</returns>
        protected override Expression<Func<Lesson, bool>> PredicateForIdOrSlug(string identity)
        {
            return p => p.Id.ToString() == identity || p.Slug == identity;
        }

        #endregion Protected Region


        /// <summary>
        /// Handle to get lesson detail
        /// </summary>
        /// <param name="identity">the course id or slug</param>
        /// <param name="lessonIdentity">the lesson id or slug</param>
        /// <param name="currentUserId">the current logged in user</param>
        /// <returns>the instance of <see cref="Lesson"/></returns>
        public async Task<Lesson> GetLessonAsync(string identity, string lessonIdentity, Guid currentUserId)
        {
            var course = await ValidateAndGetCourse(currentUserId, identity, validateForModify: true).ConfigureAwait(false);
            if (course == null)
            {
                _logger.LogWarning("Course with identity: {identity} not found for user with :{id}", identity, currentUserId);
                throw new EntityNotFoundException("Course not found");
            }

            var lesson = await _unitOfWork.GetRepository<Lesson>().GetFirstOrDefaultAsync(
                predicate: p => p.CourseId == course.Id && (p.Id.ToString() == lessonIdentity || p.Slug == lessonIdentity),
                include: src => src.Include(x => x.User)
                                    .Include(x => x.Course)
                                    .Include(x => x.Section)).ConfigureAwait(false);
            if (lesson == null)
            {
                throw new EntityNotFoundException("Lesson not found");
            }
            return lesson;
        }

        /// <summary>
        /// Handle to create lesson
        /// </summary>
        /// <param name="courseIdentity">the course id or slug</param>
        /// <param name="model">the instance of <see cref="LessonRequestModel"/></see></param>
        /// <param name="currentUserId">the current user id</param>
        /// <returns></returns>
        public async Task<Lesson> AddAsync(string courseIdentity, LessonRequestModel model, Guid currentUserId)
        {
            var course = await ValidateAndGetCourse(currentUserId, courseIdentity, validateForModify: true).ConfigureAwait(false);
            if (course == null)
            {
                _logger.LogWarning("Course with identity: {identity} not found for user with :{id}", courseIdentity, currentUserId);
                throw new EntityNotFoundException("Course not found");
            }
            var section = await _unitOfWork.GetRepository<Section>().GetFirstOrDefaultAsync(
                predicate: p => p.Id.ToString() == model.SectionIdentity || p.Slug == model.SectionIdentity).ConfigureAwait(false);

            var currentTimeStamp = DateTime.UtcNow;

            var lesson = new Lesson
            {
                Id = Guid.NewGuid(),
                CourseId = course.Id,
                Name = model.Name,
                Description = model.Description,
                ThumbnailUrl = model.ThumbnailUrl,
                Type = model.Type,
                IsPreview = model.IsPreview,
                IsMandatory = model.IsMandatory,
                SectionId = section.Id,
                CreatedBy = currentUserId,
                CreatedOn = currentTimeStamp,
                UpdatedBy = currentUserId,
                UpdatedOn = currentTimeStamp,
            };
            lesson.Slug = CommonHelper.GetEntityTitleSlug<Course>(_unitOfWork, (slug) => q => q.Slug == slug, lesson.Name);

            if (lesson.Type == LessonType.Document)
            {
                lesson.DocumentUrl = model.DocumentUrl;
            }
            if (lesson.Type == LessonType.Video)
            {
                lesson.VideoUrl = model.VideoUrl;
            }
            if (lesson.Type == LessonType.LiveClass)
            {
                await CreateMeetingAsync(model, lesson).ConfigureAwait(false);
            }
            if (lesson.Type == LessonType.Exam)
            {
                await CreateQuestionSetAsync(model, lesson).ConfigureAwait(false);
            }
            await _unitOfWork.GetRepository<Lesson>().InsertAsync(lesson).ConfigureAwait(false);
            await _unitOfWork.SaveChangesAsync().ConfigureAwait(false);
            return lesson;
        }

        /// <summary>
        /// Handle to delete lesson
        /// </summary>
        /// <param name="identity">the course id or slug</param>
        /// <param name="lessonIdentity">the lesson id or slug</param>
        /// <param name="currentUserId">the current user id</param>
        /// <returns></returns>
        public async Task DeleteLessonAsync(string identity, string lessonIdentity, Guid currentUserId)
        {

        }

        /// <summary>
        /// Handle to  create question set
        /// </summary>
        /// <param name="model">the instance of <see cref="LessonRequestModel"/></param>
        /// <param name="lesson"></param>
        /// <returns></returns>
        private async Task CreateQuestionSetAsync(LessonRequestModel model, Lesson lesson)
        {
            lesson.QuestionSet = new QuestionSet();
            lesson.QuestionSet = new QuestionSet
            {
                Id = Guid.NewGuid(),
                Slug = string.Concat(lesson.Slug, "-", lesson.Id.ToString().AsSpan(0, 5)),
                Name = lesson.Name,
                ThumbnailUrl = lesson.ThumbnailUrl,
                Description = lesson.Description,
                NegativeMarking = lesson.QuestionSet.NegativeMarking,
                QuestionMarking = lesson.QuestionSet.QuestionMarking,
                PassingWeightage = lesson.QuestionSet.PassingWeightage,
                AllowedRetake = lesson.QuestionSet.AllowedRetake,
                StartTime = lesson.QuestionSet.StartTime,
                EndTime = lesson.QuestionSet.EndTime,
                Duration = lesson.QuestionSet.Duration,
                CreatedBy = lesson.CreatedBy,
                CreatedOn = lesson.CreatedOn,
                UpdatedBy = lesson.UpdatedBy,
                UpdatedOn = lesson.UpdatedOn
            };
            lesson.Duration = model.QuestionSet.Duration;
            lesson.QuestionSetId = lesson.QuestionSet.Id;

            await _unitOfWork.GetRepository<QuestionSet>().InsertAsync(lesson.QuestionSet).ConfigureAwait(false);
        }

        private async Task CreateMeetingAsync(LessonRequestModel model, Lesson lesson)
        {
            lesson.Meeting = new Meeting();
            lesson.Meeting = new Meeting
            {
                Id = Guid.NewGuid(),
                StartDate = model.Meeting.MeetingStartDate,
                ZoomLicenseId = model.Meeting.ZoomLicenseId.Value,
                Duration = model.Meeting.MeetingDuration,
                CreatedBy = lesson.CreatedBy,
                CreatedOn = lesson.CreatedOn,
                UpdatedBy = lesson.UpdatedBy,
                UpdatedOn = lesson.UpdatedOn
            };
            lesson.MeetingId = lesson.Meeting.Id;
            lesson.Duration = model.Meeting.MeetingDuration;

            await _unitOfWork.GetRepository<Meeting>().InsertAsync(lesson.Meeting).ConfigureAwait(false);
        }


    }
}