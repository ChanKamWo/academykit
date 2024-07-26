﻿namespace AcademyKit.Application.Common.Validators
{
    using AcademyKit.Application.Common.Models.RequestModels;
    using AcademyKit.Application.ValidatorLocalization;
    using FluentValidation;
    using Microsoft.Extensions.Localization;

    public class LevelValidator : AbstractValidator<LevelRequestModel>
    {
        public LevelValidator(IStringLocalizer<ValidatorLocalizer> stringLocalizer)
        {
            RuleFor(x => x.Name)
                .NotNull()
                .NotEmpty()
                .WithMessage(context => stringLocalizer.GetString("NameRequired"))
                .MaximumLength(250)
                .WithMessage(context => stringLocalizer.GetString("NameLength250"));
        }
    }
}
