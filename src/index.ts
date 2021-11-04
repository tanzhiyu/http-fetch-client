import { HttpClient, HttpAbortHandler } from "./http-client-module";

const client = new HttpClient({
  concurrency: 2
});

client.get("/path-1").catch(() => console.log(1));
client.get("/path-2").then(() => console.log(2));
client.get("/path-3").then(() => console.log(3));
client.get("/path-4").catch(() => console.log(4));
client.get("/path-5").catch(() => console.log(5));
client.get("/path-6");
