import fetch from 'node-fetch';

async function testApi() {
  console.log("1. Logging in...");
  const loginRes = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "siddheshvikram1@gmail.com", password: "Sameer123@$", userType: "SUPPLIER", method: "email" })
  });

  const authData = await loginRes.json();
  console.log("Login Status:", loginRes.status);
  
  if (!loginRes.ok) {
      console.log("Login failed!", authData);
      return;
  }
  
  const token = authData.token;
  console.log("Token received.");

  console.log("\n2. Fetching dashboard root...");
  const dashRes = await fetch("http://localhost:8080/api/dashboard?timeFilter=monthly&year=2026", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Dashboard Root Status:", dashRes.status);
  
  console.log("\n2a. Fetching dashboard summary...");
  const dashSum = await fetch("http://localhost:8080/api/dashboard/summary?timeFilter=monthly&year=2026", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Dashboard Summary Status:", dashSum.status);

  console.log("\n2b. Fetching dashboard category...");
  const dashCat = await fetch("http://localhost:8080/api/dashboard/category-breakdown?timeFilter=monthly&year=2026", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Dashboard Category Status:", dashCat.status);

  console.log("\n4. Fetching Inventory...");
  const invRes = await fetch("http://localhost:8080/api/inventory", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Inventory Status:", invRes.status);
  
  console.log("\n5. Fetching Billing...");
  const billRes = await fetch("http://localhost:8080/api/billing-records", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Billing Status:", billRes.status);
}

testApi().catch(console.error);
