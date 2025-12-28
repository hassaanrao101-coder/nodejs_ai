const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../app");

describe("GET /health", () => {
  describe("GET request for checking server health", () => {
    test("should respond with 200 status code", async () => {
      const response = await request(app).get("/health");
      expect(response.statusCode).toBe(200);
    });
  });
});

describe("GET /", () => {
  describe("GET the main homepage in text/html form", () => {
    test("should return 200 status code", async () => {
      const response = await request(app).get("/");
      expect(response.statusCode).toBe(200);
    });
    test("should have return type text/html page", async () => {
      const response = await request(app).get("/");
      expect(response.headers["content-type"]).toEqual(
        expect.stringContaining("text/html")
      );
    });
  });
});


describe("POST /create-image", () => {
  describe("create image from given image and return url of image in json", () => {
    test("should return 200 status code with image upload", async () => {
      const testImagePath = path.join(__dirname, "image.png");

      // Read the image file
      const imageBuffer = fs.readFileSync(testImagePath);


      const response = await request(app)
        .post("/create-image")
        .field("arch", "upper")
        .field("teeth_count", "8")
        .field("brighten", "natural")
        .field("widen_upper_teeth", "true")
        .field("widen_lower_teeth", "true")
        .field("close_spaces_evenly", "true")
        .field("correct_crowding_with_alignment", "mild")
        .field("replace_missing_teeth", "true")
        .field("reduce_gummy_smile", "true")
        .field("improve_shape_of_incisal_edges", "true")
        .attach("image", testImagePath); // This is the key part!

      expect(response.statusCode).toBe(200);
    });

    test("should return JSON with image URL", async () => {
      const testImagePath = path.join(__dirname, "image.png");

      const response = await request(app)
        .post("/create-image")
        .field("arch", "upper")
        .field("teeth_count", "8")
        .field("brighten", "natural")
        .field("widen_upper_teeth", "true")
        .field("widen_lower_teeth", "true")
        .field("close_spaces_evenly", "true")
        .field("correct_crowding_with_alignment", "mild")
        .field("replace_missing_teeth", "true")
        .field("reduce_gummy_smile", "true")
        .field("improve_shape_of_incisal_edges", "true")
        .attach("image", testImagePath);

      // Check response is JSON
      expect(response.headers["content-type"]).toEqual(
        expect.stringContaining("application/json")
      );
    
      expect(response.body.success).toBe(true)

      // Check response structure
      expect(response.body.data).toHaveProperty("generatedImageUrl");
      expect(typeof response.body.data.generatedImageUrl).toBe("string");
    });

    test("should handle missing image file", async () => {
      const response = await request(app)
        .post("/create-image")
        .field("arch", "upper")
        .field("teeth_count", "8")
        .field("brighten", "natural")
        .field("widen_upper_teeth", "true");

      // Should return 400 or appropriate error status
      console.log("error response",response.body);
      expect([400, 422, 500]).toContain(response.statusCode);
    });
  });
});
