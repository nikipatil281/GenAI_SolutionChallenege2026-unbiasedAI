import axios from 'axios';
async function test() {
  try {
    const res = await axios.post("http://localhost:3000/api/llm/dataset", {
      stats: { columns: ["A", "B"], stats: { "A": { missing: 0 } } }
    });
    console.log("Success:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("Error status:", err.response.status);
      console.log("Error data:", err.response.data);
    } else {
      console.log("Error:", err.message);
    }
  }
}
test();
