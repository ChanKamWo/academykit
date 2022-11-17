namespace Lingtren.Infrastructure.Persistence.Configurations
{
    using Microsoft.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore.Metadata.Builders;
    using Lingtren.Domain.Entities;

    public class AssignmentQuestionConfiguration : IEntityTypeConfiguration<AssignmentQuestion>
    {
        public void Configure(EntityTypeBuilder<AssignmentQuestion> builder)
        {
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Id).HasColumnName("id").HasColumnType("VARCHAR(50)").HasMaxLength(50).IsRequired();
            builder.Property(x => x.QuestionId).HasColumnName("question_id").HasColumnType("VARCHAR(50)").HasMaxLength(50).IsRequired();
            builder.Property(x => x.AssignmentId).HasColumnName("assignment_id").HasColumnType("VARCHAR(50)").HasMaxLength(20).IsRequired();
            builder.Property(x => x.Order).HasColumnName("order").HasDefaultValue(0);
            builder.Property(x => x.CreatedBy).HasColumnName("created_by").HasColumnType("VARCHAR(50)").HasMaxLength(50).IsRequired();
            builder.Property(x => x.CreatedOn).HasColumnName("created_on").IsRequired().HasColumnType("DATETIME");
            builder.Property(x => x.UpdatedBy).HasColumnName("updated_by").HasColumnType("VARCHAR(50)").HasMaxLength(50).IsRequired(false);
            builder.Property(x => x.UpdatedOn).HasColumnName("updated_on").HasColumnType("DATETIME").IsRequired(false);
            builder.HasMany(x => x.AssignmentMCQSubmissions).WithOne(x => x.AssignmentQuestion).HasForeignKey(x => x.AssignmentQuestionId).OnDelete(DeleteBehavior.NoAction);
        }
    }
}