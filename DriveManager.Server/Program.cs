using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

var app = builder.Build();

var logger = app.Logger;
logger.LogInformation("Starting application...");

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    logger.LogInformation("Using Developer Exception Page");
}

// Enable CORS
app.UseCors("AllowAll");

// Global request logging middleware
app.Use(async (context, next) =>
{
    logger.LogInformation($"Incoming request: {context.Request.Method} {context.Request.Path}");
    await next(context);
});

// Serve static files from "ClientApp/dist"
var distPath = Path.Combine(Directory.GetCurrentDirectory(), "ClientApp", "dist");
logger.LogInformation($"Serving static files from: {distPath}");

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(distPath),
    RequestPath = "",
    OnPrepareResponse = ctx =>
    {
        logger.LogInformation($"Serving file: {ctx.File.PhysicalPath}");
    }
});

// Enable routing
app.UseRouting();
app.UseAuthorization();

app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers(); // Allows all HTTP methods on controllers
    endpoints.MapGet("/health", async context =>
    {
        logger.LogInformation("Health endpoint hit");
        await context.Response.WriteAsync("OK");
    });
    endpoints.MapGet("/", async context =>
    {
        logger.LogInformation("Root endpoint hit, serving index.html");
        context.Response.ContentType = "text/html";
        await context.Response.SendFileAsync(Path.Combine(distPath, "index.html"));
    });
    endpoints.MapFallbackToFile("index.html", new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(distPath),
        OnPrepareResponse = ctx =>
        {
            logger.LogInformation($"Fallback serving: {ctx.File.PhysicalPath}");
        }
    });
});

logger.LogInformation("Application configured, running...");
app.Run();
