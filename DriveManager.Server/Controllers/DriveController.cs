using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Principal;
using System.Threading.Tasks;

namespace DriveManager.Server.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class DriveController : ControllerBase
    {
        private readonly ILogger<DriveController> _logger;

        public DriveController(ILogger<DriveController> logger)
        {
            _logger = logger;
        }

        [HttpPost("test-root")]
        public async Task<IActionResult> TestRoot([FromBody] DriveRequest request)
        {
            _logger.LogInformation("Test-root endpoint hit: Path={Path}, Domain={Domain}, Username={Username}", 
                request.Path, request.Domain, request.Username);

            if (string.IsNullOrEmpty(request.Path))
            {
                _logger.LogError("Invalid request: Path is required.");
                return BadRequest(new { success = false, message = "Path is required." });
            }

            try
            {
                var netResource = new NetResource
                {
                    Scope = ResourceScope.GlobalNetwork,
                    ResourceType = ResourceType.Disk,
                    DisplayType = ResourceDisplayType.Share,
                    RemoteName = request.Path
                };

                _logger.LogInformation("Attempting to connect to network share: {Path}", request.Path);

                // Using the currently logged-in Windows user
                int result = WNetUseConnection(IntPtr.Zero, netResource, null, null, 1, null, null, null);

                if (result != 0)
                {
                    string errorMessage = $"Failed to connect to {request.Path}. Error code: {result}";
                    _logger.LogError(errorMessage);
                    return BadRequest(new { success = false, message = errorMessage });
                }

                _logger.LogInformation("Connected successfully to {Path}, fetching directories...", request.Path);

                // Fetch directories
                List<string> folderNames = new List<string>();
                string[] folders = Directory.GetDirectories(request.Path);
                foreach (var folder in folders)
                {
                    folderNames.Add(folder);
                }

                _logger.LogInformation("Success: Found {Count} folders", folderNames.Count);
                return Ok(new { success = true, message = "Connected successfully", folders = folderNames });

            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError("Access denied to {Path}: {Message}", request.Path, ex.Message);
                return Unauthorized(new { success = false, message = "Access denied: Ensure the app has proper permissions." });
            }
            catch (Exception ex)
            {
                _logger.LogError("Exception in TestRoot: {Message}, StackTrace: {StackTrace}", ex.Message, ex.StackTrace);
                return BadRequest(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [DllImport("mpr.dll", CharSet = CharSet.Auto)]
        private static extern int WNetUseConnection(IntPtr hwndOwner, NetResource lpNetResource, string lpPassword, string lpUserName, int dwFlags, string lpAccessName, string lpBufferSize, string lpResult);

        public class NetResource
        {
            public ResourceScope Scope { get; set; }
            public ResourceType ResourceType { get; set; }
            public ResourceDisplayType DisplayType { get; set; }
            public string RemoteName { get; set; }
        }

        public enum ResourceScope { Connected = 1, GlobalNetwork, Remembered, Recent, Context }
        public enum ResourceType { Any = 0, Disk = 1, Print = 2, Reserved = 8 }
        public enum ResourceDisplayType { Generic = 0, Domain = 1, Server = 2, Share = 3, File = 4, Group = 5, Network = 6, Root = 7, ShareAdmin = 8, Directory = 9, Tree = 10, NdsContainer = 11 }
    }

    public class DriveRequest
    {
        public string Path { get; set; }
        public string Domain { get; set; }
        public string Username { get; set; }
    }
}
