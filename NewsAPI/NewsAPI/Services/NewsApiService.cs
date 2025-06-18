using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using NewsAPI.Models;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;
using Microsoft.Extensions.Logging;

namespace NewsAPI.Services
{
    public class NewsApiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly ILogger<NewsApiService> _logger;
        private readonly string _baseUrl = "https://newsapi.org/v2";
        private readonly JsonSerializerOptions _jsonOptions;

        public NewsApiService(HttpClient httpClient, IConfiguration configuration, ILogger<NewsApiService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _apiKey = configuration["NewsApi:ApiKey"] ?? throw new ArgumentNullException("NewsApi:ApiKey", "API key is not configured");
            
            _logger.LogInformation("Initializing NewsApiService with API key: {ApiKey}", _apiKey);
            
            // Set up the default headers
            _httpClient.DefaultRequestHeaders.Accept.Clear();
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "NewsAPI-ASP.NET");

            // Configure JSON serialization options
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
        }

        public async Task<NewsResponse> GetTopHeadlinesAsync(string country = "us", string category = null)
        {
            try
            {
                var url = $"{_baseUrl}/top-headlines?country={country}";
                if (!string.IsNullOrEmpty(category))
                {
                    url += $"&category={category}";
                }

                _logger.LogInformation("Making request to: {Url}", url);
                _logger.LogInformation("Headers: {Headers}", 
                    string.Join(", ", _httpClient.DefaultRequestHeaders.Select(h => $"{h.Key}: {string.Join(", ", h.Value)}")));

                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("API Error: {StatusCode} - {ErrorContent}", response.StatusCode, errorContent);
                    throw new Exception($"News API error: {response.StatusCode} - {errorContent}");
                }
                
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("API Response: {Content}", content);
                
                var newsResponse = JsonSerializer.Deserialize<NewsResponse>(content, _jsonOptions);
                _logger.LogInformation("Deserialized response - Status: {Status}, TotalResults: {TotalResults}, Articles: {ArticleCount}", 
                    newsResponse.Status, newsResponse.TotalResults, newsResponse.Articles?.Count ?? 0);
                
                return newsResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching news");
                throw new Exception($"Error fetching news: {ex.Message}", ex);
            }
        }

        public async Task<NewsResponse> SearchNewsAsync(string query)
        {
            try
            {
                var url = $"{_baseUrl}/everything?q={Uri.EscapeDataString(query)}";
                _logger.LogInformation("Making search request to: {Url}", url);

                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("API Error: {StatusCode} - {ErrorContent}", response.StatusCode, errorContent);
                    throw new Exception($"News API error: {response.StatusCode} - {errorContent}");
                }
                
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("API Response: {Content}", content);
                
                var newsResponse = JsonSerializer.Deserialize<NewsResponse>(content, _jsonOptions);
                _logger.LogInformation("Deserialized response - Status: {Status}, TotalResults: {TotalResults}, Articles: {ArticleCount}", 
                    newsResponse.Status, newsResponse.TotalResults, newsResponse.Articles?.Count ?? 0);
                
                return newsResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching news");
                throw new Exception($"Error searching news: {ex.Message}", ex);
            }
        }
    }
} 