using Microsoft.AspNetCore.Mvc;
using NewsAPI.Services;
using NewsAPI.Models;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace NewsAPI.Controllers
{
    public class NewsController : Controller
    {
        private readonly NewsApiService _newsApiService;

        public NewsController(NewsApiService newsApiService)
        {
            _newsApiService = newsApiService;
        }

        public async Task<IActionResult> Index()
        {
            try
            {
                var news = await _newsApiService.GetTopHeadlinesAsync();
                return View(news);
            }
            catch (Exception)
            {
                // Log the error
                TempData["Error"] = "Unable to fetch news. Please try again later.";
                return View(new NewsResponse { Articles = new List<NewsArticle>() });
            }
        }

        public async Task<IActionResult> Category(string category)
        {
            try
            {
                var news = await _newsApiService.GetTopHeadlinesAsync(category: category);
                return View("Index", news);
            }
            catch (Exception)
            {
                // Log the error
                TempData["Error"] = "Unable to fetch news for the selected category. Please try again later.";
                return View("Index", new NewsResponse { Articles = new List<NewsArticle>() });
            }
        }

        public async Task<IActionResult> Search(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return RedirectToAction(nameof(Index));
            }

            try
            {
                var news = await _newsApiService.SearchNewsAsync(query);
                return View("Index", news);
            }
            catch (Exception)
            {
                // Log the error
                TempData["Error"] = "Unable to search news. Please try again later.";
                return View("Index", new NewsResponse { Articles = new List<NewsArticle>() });
            }
        }
    }
} 