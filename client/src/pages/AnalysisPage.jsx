
import { useState } from "react";
import axios from "axios";
import "./AnalysisPage.css";
import ReactMarkdown from "react-markdown";
import CodeReview from "../CodeReview";

function AnalysisPage({ repository, repositoryContents }) {
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  if (!repository) {
    return <p>No repository information available.</p>;
  }

  const contents = repositoryContents;
  const files = contents?.files || [];
  const technologies = contents?.technologies || [];

  const details = [
    { label: "Primary Language", value: repository.language || "Unknown" },
    { label: "Stars", value: repository.stars },
    { label: "Forks", value: repository.forks },
    { label: "Open Issues", value: repository.openIssues },
  ];

  const visibleFiles = files
    .filter((file) => file.path.split("/").length <= 2)
    .slice(0, 30);

  const importantFiles = [
    "package.json",
    "README.md",
    "index.html",
    "requirements.txt",
    "pom.xml",
    "Dockerfile",
    "server.js",
    "App.jsx",
  ];

  const detectedImportantFiles = files.filter((file) =>
    importantFiles.includes(file.path.split("/").pop())
  );

  // Generate AI repository analysis
  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiError("");
    setAiAnalysis("");

    const prompt = `
You are an expert software engineer and code analyst.

Analyze the following GitHub repository using the information provided.

Repository Name: ${repository.fullName}
Description: ${repository.description || "Not available"}
Primary Language: ${repository.language || "Not specified"}
Stars: ${repository.stars}
Forks: ${repository.forks}
Open Issues: ${repository.openIssues}
Default Branch: ${repository.defaultBranch}

Detected Technologies:
${technologies.map((tech) =>
  `${tech.name}: ${tech.fileCount} files`
).join("\n")}

Repository Files:
${visibleFiles.map((file) =>
  `${file.type}: ${file.path}`
).join("\n")}

Important Files:
${detectedImportantFiles.map((file) => file.path).join("\n")}

Provide the analysis in these sections:

1. Project Overview
2. Main Purpose of the Project
3. Technologies and Their Uses
4. Project Structure Explanation
5. Key Features (only infer features when supported by the available information)
6. Possible Improvements
7. Overall Assessment

Use simple, professional language.
Use headings and bullet points.
Do not invent features or claim to have inspected source code that was not provided.
`;

    try {
      const response = await axios.post(
        "http://localhost:5000/api/ai/analyze",
        { prompt }
      );

      if (response.data.success) {
        setAiAnalysis(response.data.analysis);
      } else {
        setAiError("Unable to generate AI analysis.");
      }
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setAiError(
        error.response?.data?.message ||
        "AI analysis failed. Please try again."
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="analysis-page">
      <div className="analysis-header">
        <div>
          <span className="tag">✦ REAL GITHUB ANALYSIS</span>
          <h1>Repository Overview</h1>
          <p>Actual information fetched from GitHub.</p>
        </div>
        <span className="repo-status">● Connected to GitHub</span>
      </div>

      <div className="repo-summary">
        <div>
          <span>📦</span>
          <div>
            <h2>{repository.fullName}</h2>
            <p>{repository.description || "No description available."}</p>
            <a href={repository.url} target="_blank" rel="noreferrer">
              View on GitHub ↗
            </a>
          </div>
        </div>
      </div>

      <div className="analysis-stats">
        {details.map((item) => (
          <div className="analysis-card" key={item.label}>
            <p>{item.label}</p>
            <h2>{item.value}</h2>
          </div>
        ))}

        <div className="analysis-card">
          <p>Total Files</p>
          <h2>{contents ? contents.totalFiles : "Loading..."}</h2>
        </div>

        <div className="analysis-card">
          <p>Total Folders</p>
          <h2>{contents ? contents.totalFolders : "Loading..."}</h2>
        </div>
      </div>

      <div className="analysis-grid">
        <section className="analysis-card">
          <h3>💻 Detected Technologies</h3>

          {technologies.length > 0 ? (
            technologies.map((tech) => (
              <div className="tech-item" key={tech.extension}>
                <span>{tech.name}</span>
                <small>{tech.fileCount} files</small>
              </div>
            ))
          ) : (
            <p>No technology information available.</p>
          )}
        </section>

        <section className="analysis-card">
          <h3>📁 Project Structure</h3>

          {visibleFiles.length > 0 ? (
            visibleFiles.map((file) => (
              <p className="file-item" key={file.path}>
                {file.type === "folder" ? "📁 " : "📄 "}
                {file.path}
              </p>
            ))
          ) : (
            <p>Repository files are loading or unavailable.</p>
          )}

          {files.length > visibleFiles.length && (
            <p>Showing {visibleFiles.length} entries from the repository.</p>
          )}

          {contents?.truncated && (
            <p>GitHub returned a truncated file tree.</p>
          )}
        </section>

        <section className="analysis-card">
          <h3>📌 Important Project Files</h3>

          {detectedImportantFiles.length > 0 ? (
            detectedImportantFiles.map((file) => (
              <p className="file-item" key={file.path}>
                📄 {file.path}
              </p>
            ))
          ) : (
            <p>No common project configuration files detected.</p>
          )}
        </section>

        <section className="analysis-card">
          <h3>📊 Repository Statistics</h3>

          <div className="tech-item">
            <span>⭐ Stars</span>
            <small>{repository.stars}</small>
          </div>

          <div className="tech-item">
            <span>🍴 Forks</span>
            <small>{repository.forks}</small>
          </div>

          <div className="tech-item">
            <span>🐛 Open Issues</span>
            <small>{repository.openIssues}</small>
          </div>

          <div className="tech-item">
            <span>🌿 Default Branch</span>
            <small>{repository.defaultBranch}</small>
          </div>
        </section>
      </div>

      {/* AI Analysis Section */}
      <section
        className="analysis-card"
        style={{ marginTop: "25px", padding: "25px" }}
      >
        <h2>🤖 AI Repository Analysis</h2>

        <p>
          Get an AI-generated explanation of your repository,
          technologies, project structure, and possible improvements.
        </p>

        <button
          onClick={handleAIAnalysis}
          disabled={aiLoading}
          style={{
            padding: "12px 24px",
            marginTop: "15px",
            background: "#6c63ff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: aiLoading ? "not-allowed" : "pointer",
            opacity: aiLoading ? 0.7 : 1,
            fontSize: "15px",
          }}
        >
          {aiLoading ? "Analyzing Repository..." : "✨ Generate AI Analysis"}
        </button>

        {aiLoading && (
          <p style={{ marginTop: "20px" }}>
            Gemini AI is analyzing your repository. Please wait...
          </p>
        )}

        {aiError && (
          <p style={{ color: "red", marginTop: "20px" }}>
            {aiError}
          </p>
        )}

        {aiAnalysis && (
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              borderRadius: "10px",
              background: "rgba(108, 99, 255, 0.08)",
              lineHeight: "1.8",
              whiteSpace: "pre-wrap",
            }}
          >
            <h3>✨ AI Analysis Results</h3>
            <div className="ai-markdown">
  <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
</div>
          </div>
        )}
      </section>
       <CodeReview
  repository={repository}
  repositoryContents={repositoryContents}
/>
    </div>
  );
}

export default AnalysisPage;
