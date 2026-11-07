
import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

function CodeReview({ repository, repositoryContents }) {
  const [selectedFile, setSelectedFile] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const files = (repositoryContents?.files || []).filter((file) => {
    return (
      file.type === "file" &&
      /\.(js|jsx|ts|tsx|py|java|cpp|c|html|css)$/i.test(file.path)
    );
  });

  const handleReview = async () => {
    if (!selectedFile) {
      setError("Please select a source code file.");
      return;
    }

    setLoading(true);
    setError("");
    setReview("");

    try {
      const [owner, repo] = repository.fullName.split("/");

      // Fetch actual source code from GitHub
      const fileResponse = await axios.get(
        `http://localhost:5000/api/github/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/file`,
        {
          params: {
            path: selectedFile,
            branch: repository.defaultBranch
          }
        }
      );

      const sourceCode = fileResponse.data.file.content;

      if (!sourceCode.trim()) {
        throw new Error("The selected file is empty.");
      }

      const prompt = `
You are an expert software developer and code reviewer.

Review the following source code carefully.

File: ${selectedFile}
Repository: ${repository.fullName}

Source Code:
${sourceCode}

Provide your review using these sections:

1. Code Overview
2. Code Explanation
3. Code Quality
4. Potential Bugs or Issues
5. Security Considerations
6. Performance Improvements
7. Suggested Improvements
8. Overall Review

Be specific. Refer only to issues supported by the supplied code.
Use simple, professional language and Markdown formatting.
`;

      // Send source code to Gemini for review
      const aiResponse = await axios.post(
        "http://localhost:5000/api/ai/analyze",
        { prompt },
        { timeout: 120000 }
      );

      if (aiResponse.data.success) {
        setReview(aiResponse.data.analysis);
      } else {
        throw new Error(
          aiResponse.data.message || "Unable to review the code."
        );
      }

    } catch (err) {
      console.error("Code Review Error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Code review failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="analysis-card" style={{ marginTop: "25px", padding: "25px" }}>
      <h2>🧑‍💻 AI Code Review</h2>

      <p>
        Select a source code file and let Gemini analyze its quality,
        potential bugs, security, and possible improvements.
      </p>

      <select
        value={selectedFile}
        onChange={(e) => setSelectedFile(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "15px",
          marginBottom: "15px",
          borderRadius: "8px"
        }}
      >
        <option value="">Select a source code file</option>

        {files.map((file) => (
          <option key={file.path} value={file.path}>
            {file.path}
          </option>
        ))}
      </select>

      <button
        onClick={handleReview}
        disabled={loading || !selectedFile}
      >
        {loading ? "Reviewing Code..." : "✨ Review Selected File"}
      </button>

      {loading && (
        <p>Gemini is reviewing your source code. Please wait...</p>
      )}

      {error && (
        <p style={{ color: "red" }}>{error}</p>
      )}

      {review && (
        <div className="ai-markdown" style={{ marginTop: "25px" }}>
          <h3>✨ Code Review Results</h3>
          <ReactMarkdown>{review}</ReactMarkdown>
        </div>
      )}

      {files.length === 0 && (
        <p>No supported source code files were found.</p>
      )}
    </section>
  );
}

export default CodeReview;
