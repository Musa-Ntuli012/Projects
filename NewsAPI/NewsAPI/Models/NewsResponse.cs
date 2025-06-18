using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace NewsAPI.Models
{
    public class NewsResponse
    {
        [JsonPropertyName("status")]
        public string Status { get; set; }

        [JsonPropertyName("totalResults")]
        public int TotalResults { get; set; }

        [JsonPropertyName("articles")]
        public List<NewsArticle> Articles { get; set; }
    }
} 