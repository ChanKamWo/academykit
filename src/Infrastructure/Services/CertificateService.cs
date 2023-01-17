namespace Lingtren.Infrastructure.Services
{
    using Lingtren.Application.Common.Exceptions;
    using Lingtren.Application.Common.Interfaces;
    using Lingtren.Application.Common.Models.RequestModels;
    using Lingtren.Application.Common.Models.ResponseModels;
    using Lingtren.Domain.Entities;
    using Lingtren.Infrastructure.Common;
    using Lingtren.Infrastructure.Helpers;
    using Microsoft.Extensions.Logging;
    using Microsoft.EntityFrameworkCore;
    using Lingtren.Application.Common.Dtos;

    public class CertificateService : BaseService, ICertificateService
    {
        public CertificateService(IUnitOfWork unitOfWork, ILogger<CertificateService> logger) : base(unitOfWork, logger)
        {
        }

        /// <summary>
        /// Handle to save external certificate 
        /// </summary>
        /// <param name="model"> the instance of <see cref="CertificateRequestModel" /> .</param>
        /// <param name="currentUserId"> the user id </param>
        /// <returns> the instance of <see cref="CertificateResponseModel" /> .</returns>
        public async Task<CertificateResponseModel> SaveExternalCertificateAsync(CertificateRequestModel model, Guid currentUserId)
        {
            return await ExecuteWithResultAsync(async () =>
            {
                var certificate = new Certificate
                {
                    Id = Guid.NewGuid(),
                    Name = model.Name,
                    StartDate = model.StartDate,
                    EndDate = model.EndDate,
                    ImageUrl = model.ImageUrl,
                    Institute = model.Institute,
                    Duration = model.Duration,
                    IsVerified = false,
                    CreatedBy = currentUserId,
                    CreatedOn = DateTime.UtcNow
                };
                await _unitOfWork.GetRepository<Certificate>().InsertAsync(certificate).ConfigureAwait(false);
                await _unitOfWork.SaveChangesAsync().ConfigureAwait(false);
                return new CertificateResponseModel(certificate);
            });
        }

        /// <summary>
        /// Handle to update the external certificate 
        /// </summary>
        /// <param name="identity"> certificate id or slug </param>
        /// <param name="model"> the instance of <see cref="CertificateRequestModel" /> .</param>
        /// <param name="currentUserId"> the current user id </param>
        /// <returns></returns>
        public async Task<CertificateResponseModel> UpdateExternalCertificateAsync(Guid identity, CertificateRequestModel model, Guid currentUserId)
        {
            return await ExecuteWithResultAsync(async () =>
            {
                var ceritificate = await _unitOfWork.GetRepository<Certificate>().GetFirstOrDefaultAsync(predicate: p => p.Id == identity).ConfigureAwait(false);
                if (ceritificate == null)
                {
                    throw new EntityNotFoundException($"Certificate with identity : {identity} not found.");
                }

                if (ceritificate.CreatedBy != currentUserId)
                {
                    throw new ForbiddenException("Unauthorized user.");
                }

                if (ceritificate.IsVerified)
                {
                    throw new ArgumentException("Cerificate with identity : {identity} is already verified.");
                }

                ceritificate.Name = model.Name;
                ceritificate.StartDate = model.StartDate;
                ceritificate.EndDate = model.EndDate;
                ceritificate.ImageUrl = model.ImageUrl;
                ceritificate.Institute = model.Institute;
                ceritificate.Duration = model.Duration;
                ceritificate.UpdatedBy = currentUserId;
                ceritificate.UpdatedOn = DateTime.UtcNow;
                return new CertificateResponseModel(ceritificate);
            });
        }

        /// <summary>
        /// Handle to delete the external certificate async
        /// </summary>
        /// <param name="identity"> the ceritifcate id or slug </param>
        /// <param name="currentUserId"> the current user id </param>
        /// <returns> the task complete </returns>
        public async Task DeleteExternalCertificateAsync(Guid identity, Guid currentUserId)
        {
            try
            {
                var ceritificate = await _unitOfWork.GetRepository<Certificate>().GetFirstOrDefaultAsync(predicate:p  => p.Id == identity).ConfigureAwait(false);
                if (ceritificate == null)
                {
                    throw new EntityNotFoundException($"Certificate with identity : {identity} not found.");
                }

                if (ceritificate.CreatedBy != currentUserId)
                {
                    throw new ForbiddenException("Unauthorized user.");
                }
                _unitOfWork.GetRepository<Certificate>().Delete(ceritificate);
                await _unitOfWork.SaveChangesAsync().ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw ex is ServiceException ? ex : new ServiceException(ex.Message);
            }
        }

        /// <summary>
        /// Handle to get external certificate
        /// </summary>
        /// <param name="currentUserId"> the current user id </param>
        /// <returns> the list of <see cref="CertificateResponseModel" /> .</returns>
        public async Task<IList<CertificateResponseModel>> GetExternalCertificateAsync(Guid currentUserId)
        {
            try
            {
                var response = new List<CertificateResponseModel>();
                var certificates = await _unitOfWork.GetRepository<Certificate>().GetAllAsync(predicate: p => p.CreatedBy == currentUserId,
                include: source => source.Include(x => x.User)).ConfigureAwait(false);
                if (response.Count != default)
                {
                    response = certificates.Select(x => new CertificateResponseModel
                    {
                        Id = x.Id,
                        Name = x.Name,
                        StartDate = x.StartDate,
                        EndDate = x.EndDate,
                        Institute = x.Institute,
                        ImageUrl = x.ImageUrl,
                        Duration = x.Duration != default ? x.Duration.ToString() : null,
                        Location = x.Location,
                        IsVerified = x.IsVerified,
                        User = new UserModel(x.User)
                    }).ToList();
                }
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw ex is ServiceException ? ex : new ServiceException(ex.Message);
            }
        }

        /// <summary>
        /// Handle to get certificate details 
        /// </summary>
        /// <param name="identity"> the id or slug </param>
        /// <param name="currentUserId"> the current user id </param>
        /// <returns> the instance of <see cref="CertificateResponseModel" /> .</returns>
        public async Task<CertificateResponseModel> GetCertificateDetailAsync(Guid identity, Guid currentUserId)
        {
            return await ExecuteWithResultAsync(async () =>
            {

                var ceritifcate = await _unitOfWork.GetRepository<Certificate>().GetFirstOrDefaultAsync(predicate: p => p.Id == identity, include: source => source.Include(x => x.User)).ConfigureAwait(false);

                if (ceritifcate == default)
                {
                    throw new EntityNotFoundException("Certificate not found");
                }

                if (!ceritifcate.IsVerified)
                {
                    var isAccess = await UnverifiedCertificateAccess(ceritifcate, currentUserId).ConfigureAwait(false);
                    if (!isAccess)
                    {
                        throw new ArgumentException("Certificate is not verified");
                    }
                }

                return new CertificateResponseModel
                {
                    Id = ceritifcate.Id,
                    Name = ceritifcate.Name,
                    StartDate = ceritifcate.StartDate,
                    EndDate = ceritifcate.EndDate,
                    Institute = ceritifcate.Institute,
                    ImageUrl = ceritifcate.ImageUrl,
                    Duration = ceritifcate.Duration != default ? ceritifcate.Duration.ToString() : null,
                    Location = ceritifcate.Location,
                    IsVerified = ceritifcate.IsVerified,
                    User = new UserModel(ceritifcate.User)
                };
            });
        }

        /// <summary>
        /// Handle to get user certificates
        /// </summary>
        /// <param name="userId"> the user id </param>
        /// <returns> the list of <see cref="CertificateResponseModel" /> </returns>
        public async Task<IList<CertificateResponseModel>> GetUserCertificateAsync(Guid userId)
        {
            try
            {
                var response = new List<CertificateResponseModel>();
                var certificates = await _unitOfWork.GetRepository<Certificate>().GetAllAsync(predicate: p => p.CreatedBy == userId && p.IsVerified,
                include: source => source.Include(x => x.User)).ConfigureAwait(false);
                if (response.Count != default)
                {
                    response = certificates.Select(x => new CertificateResponseModel
                    {
                        Id = x.Id,
                        Name = x.Name,
                        StartDate = x.StartDate,
                        EndDate = x.EndDate,
                        Institute = x.Institute,
                        ImageUrl = x.ImageUrl,
                        Duration = x.Duration != default ? x.Duration.ToString() : null,
                        Location = x.Location,
                        IsVerified = x.IsVerified,
                        User = new UserModel(x.User)
                    }).ToList();
                }
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw ex is ServiceException ? ex : new ServiceException(ex.Message);
            }
        }

        /// <summary>
        /// Handle to get unverified certificate
        /// </summary>
        /// <param name="criteria"> the instance of <see cref="CertificateBaseSearchCriteria" /> .</param>
        /// <param name="currentUserId"> the current user id </param>
        /// <returns> the list of <see cref="CertificateReviewResponseModel" /> .</returns>
        public async Task<SearchResult<CertificateReviewResponseModel>> GetReviewCertificatesAsync(CertificateBaseSearchCriteria criteria, Guid currentUserId)
        {
            try
            {
                var hasAccess = await IsSuperAdminOrAdmin(currentUserId).ConfigureAwait(false);
                if (!hasAccess)
                {
                    throw new ForbiddenException("Unauthorized user");
                }
                var response = new List<CertificateReviewResponseModel>();
                var certificates = await _unitOfWork.GetRepository<Certificate>().GetAllAsync(predicate: p => !p.IsVerified,
                include: source => source.Include(x => x.User)).ConfigureAwait(false);
                if (response.Count != default)
                {
                    response = certificates.Select(x => new CertificateReviewResponseModel
                    {
                        Id = x.Id,
                        CerificateName = x.Name,
                        StartDate = x.StartDate,
                        EndDate = x.EndDate,
                        UserId = x.CreatedBy,
                        UserName = x.User.FullName
                    }).ToList();
                }
                return response.ToIPagedList(criteria.Page, criteria.Size);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw ex is ServiceException ? ex : new ServiceException(ex.Message);
            }
        }

        /// <summary>
        /// Handle to verify certificate
        /// </summary>
        /// <param name="identity"> the certificate id or slug </param>
        /// <param name="currentUserId"> the current user id </param>
        /// <returns> the task complete </returns>
        public async Task VerifyCertificateAsync(Guid identity, Guid currentUserId)
        {
            try
            {
                var hasAccess = await IsSuperAdminOrAdmin(currentUserId).ConfigureAwait(false);
                if (!hasAccess)
                {
                    throw new ForbiddenException("Unauthorized user");
                }

                var ceritifcate = await _unitOfWork.GetRepository<Certificate>().GetFirstOrDefaultAsync(predicate: p => p.Id == identity).ConfigureAwait(false);

                if (ceritifcate == default)
                {
                    throw new EntityNotFoundException("Certificate not found");
                }

                ceritifcate.IsVerified = true;
                _unitOfWork.GetRepository<Certificate>().Update(ceritifcate);
                await _unitOfWork.SaveChangesAsync().ConfigureAwait(false);
            }
            catch (Exception ex)
            {

                _logger.LogError(ex.Message);
                throw ex is ServiceException ? ex : new ServiceException(ex.Message);
            }
        }

        #region  private method

        /// <summary>
        /// Handle to check unverified certificate access
        /// </summary>
        /// <param name="certificate"> the instance of <see cref="Certificate" /> .</param>
        /// <param name="currentUserId"> the current user id </param>
        /// <returns> the boolean value </returns>
        private async Task<bool> UnverifiedCertificateAccess(Certificate certificate, Guid currentUserId)
        {
            if (certificate.CreatedBy == currentUserId)
            {
                return true;
            }

            return await IsSuperAdminOrAdmin(currentUserId).ConfigureAwait(false);
        }


        #endregion
    }
}