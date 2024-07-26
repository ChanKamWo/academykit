﻿namespace AcademyKit.Application.Common.Interfaces
{
    using AcademyKit.Application.Common.Dtos;
    using AcademyKit.Domain.Entities;

    public interface IGroupMemberService
        : IGenericService<GroupMember, GroupMemberBaseSearchCriteria> { }
}
