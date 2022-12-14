﻿namespace Lingtren.Application.Common.Interfaces
{
    using Lingtren.Application.Common.Dtos;
    using Lingtren.Application.Common.Models.RequestModels;
    using Lingtren.Application.Common.Models.ResponseModels;
    using Lingtren.Domain.Entities;
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;

    public interface IAssignmentService : IGenericService<Assignment, AssignmentBaseSearchCriteria>
    {
        /// <summary>
        /// Handle to update course
        /// </summary>
        /// <param name="identity">the assignment id or slug</param>
        /// <param name="model">the instance of <see cref="AssignmentRequestModel"/> </param>
        /// <param name="currentUserId">the current user id</param>
        /// <returns></returns>
        Task<Assignment> UpdateAsync(string identity, AssignmentRequestModel model, Guid currentUserId);

        /// <summary>
        /// Handle to submit assignments by the user
        /// </summary>
        /// <param name="lessonIdentity">the lesson id or slug</param>
        /// <param name="model">the list of <see cref="AssignmentSubmissionRequestModel"/></param>
        /// <param name="currentUserId">the current logged in user</param>
        /// <returns></returns>
        Task AssignmentSubmissionAsync(string lessonIdentity, IList<AssignmentSubmissionRequestModel> model, Guid currentUserId);

        /// <summary>
        /// Handle to get list of student who has submitted assignment
        /// </summary>
        /// <param name="lessonIdentity">the lesson id or slug</param>
        /// <param name="currentUserId">the current user id</param>
        /// <returns></returns>
        Task<IList<AssignmentSubmissionStudentResponseModel>> GetAssignmentSubmittedStudent(string lessonIdentity, Guid currentUserId);

        /// <summary>
        /// Handle to search assignment
        /// </summary>
        /// <param name="searchCriteria">the instance of <see cref="AssignmentBaseSearchCriteria"/></param>
        /// <returns></returns>
        Task<IList<AssignmentResponseModel>> SearchAsync(AssignmentBaseSearchCriteria searchCriteria);
    }
}
