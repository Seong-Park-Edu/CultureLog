using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace CultureLog.API.Models
{
    [Table("Comment")]
    public class Comment : BaseModel
    {
        [PrimaryKey("id")]
        public long Id { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("content")]
        public string Content { get; set; } = string.Empty;

        [Column("user_id")]
        public string UserId { get; set; } = string.Empty;

        [Column("user_email")]
        public string UserEmail { get; set; } = string.Empty;

        [Column("review_id")]
        public long ReviewId { get; set; }
    }
}