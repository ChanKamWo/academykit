﻿namespace Lingtren.Application.Common.Models.RequestModels
{
    using Lingtren.Application.Common.Dtos;
    using Microsoft.AspNetCore.Http;

    public class MediaRequestModel
    {
        public IFormFile File { get; set; }

        public MediaType Type { get; set; }
    }
}
