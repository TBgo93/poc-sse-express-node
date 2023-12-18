const express = require("express");
const crypto = require("node:crypto")
const app = express();
const PORT = 8443;

app.use(express.json())
app.use(express.static("public"))

// Helper
const sendSSE = (res) => ({ eventName, eventMessage, id }) => {
  res.write(String(id + "\n"))
  res.write(String(eventName + "\n"))
  res.write(String(eventMessage + "\n\n"))
}

const DATA_POST = {
  last: {
    id: undefined,
    data: undefined
  },
  prev: {
    id: undefined,
    data: undefined
  }
}

app.get("/current-time", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  })
  
  // Fake data for SSE
  const intervalId = setInterval(() => {
    const message = `Server Time: ${new Date().toLocaleTimeString()}`;

    const response = {
      id: `id: ${crypto.randomUUID()}`,
      eventName: "event: current-time",
      eventMessage: `data: ${message}`,
    }
  
    sendSSE(res)(response);
  }, 1000);
  
  // Close SSE
  req.on("close", () => {
    clearInterval(intervalId);
  });
});

app.get("/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  })
  
  // Fake data for SSE
  const intervalId = setInterval(() => {
    const { last, prev } = DATA_POST

    if(last.id !== prev.id) {
      const response = {
        id: `id: ${last.id}`,
        eventName: "event: events",
        eventMessage: `data: ${last.data} - ${last.id}`,
      }

      sendSSE(res)(response);
    }
  }, 1000)

  req.on("close", () => {
    clearInterval(intervalId);
  });
});

app.post("/send_events", (req, res) => {
  const { data } = req.body
  const id = crypto.randomUUID()

  try {
    DATA_POST.prev.data = DATA_POST.last.data
    DATA_POST.prev.id = DATA_POST.last.id

    DATA_POST.last.data = data
    DATA_POST.last.id = id

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});