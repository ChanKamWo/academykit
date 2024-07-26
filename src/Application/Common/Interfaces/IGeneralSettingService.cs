﻿namespace AcademyKit.Application.Common.Interfaces
{
    using AcademyKit.Application.Common.Dtos;
    using AcademyKit.Domain.Entities;

    public interface IGeneralSettingService
        : IGenericService<GeneralSetting, BaseSearchCriteria> { }
}
