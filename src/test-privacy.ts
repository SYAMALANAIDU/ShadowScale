import { maskSensitiveData } from "./privacy-shield.js";

const sampleData = {
  username: "Sam",
  email: "sam@example.com",
  password: "mypassword123",
  api_key: "secret-api-key",
  authorization: "Bearer abc123xyz",
  profile: {
    access_token: "token-12345",
    city: "Vijayawada",
  },
};

const result = maskSensitiveData(sampleData);

console.log("Original data contains sensitive fields.");
console.log("Privacy Shield Output:");
console.log(JSON.stringify(result, null, 2));