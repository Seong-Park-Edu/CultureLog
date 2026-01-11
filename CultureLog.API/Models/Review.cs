using Supabase.Postgrest.Attributes; // Supabase용 명찰
using Supabase.Postgrest.Models;     // Supabase 기본 모델

namespace CultureLog.API.Models
{
    // 1. [Table]: 이 클래스는 Supabase의 "reviews" 테이블과 연결된다!
    [Table("reviews")]
    public class Review : BaseModel
    {
        // 2. [PrimaryKey]: 고유 번호
        [PrimaryKey("id", false)] // false = DB가 알아서 만듦 (Auto Increment)
        public long Id { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("image_url")]
        public string? ImageUrl { get; set; }

        [Column("type")]
        public string Type { get; set; } = string.Empty; // Movie, Book

        [Column("external_id")]
        public string? ExternalId { get; set; }

        [Column("review_content")]
        public string? ReviewContent { get; set; }

        [Column("rating")]
        public int Rating { get; set; }

        [Column("is_public")]
        public bool IsPublic { get; set; } = true;

        [Column("user_id")]
        public string? UserId { get; set; }

        [Column("author")]
        public string? Author { get; set; }
    }
}