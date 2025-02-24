import geminiModel from "../configs/gemini.config.js";
import fs from "fs";

// Your existing Levenshtein distance calculation
export const calculateLevenshteinDistance = (str1, str2) => {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    track[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return track[str2.length][str1.length];
};

// Your existing similarity score calculation
export const calculateSimilarityScore = (str1, str2) => {
  if (!str1 || !str2) return 0;

  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100; // Both strings are empty

  const distance = calculateLevenshteinDistance(str1, str2);
  const similarity = (1 - distance / maxLength) * 100;

  return Math.max(0, similarity);
};

// Enhanced word frequency analysis
const getWordFrequency = (text) => {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3);

  const frequency = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return frequency;
};

// Calculate semantic similarity
const calculateSemanticSimilarity = (sourceFreq, targetFreq) => {
  const allWords = new Set([
    ...Object.keys(sourceFreq),
    ...Object.keys(targetFreq),
  ]);
  let dotProduct = 0;
  let sourceNorm = 0;
  let targetNorm = 0;

  for (const word of allWords) {
    const sourceCount = sourceFreq[word] || 0;
    const targetCount = targetFreq[word] || 0;
    dotProduct += sourceCount * targetCount;
    sourceNorm += sourceCount * sourceCount;
    targetNorm += targetCount * targetCount;
  }

  return dotProduct / (Math.sqrt(sourceNorm) * Math.sqrt(targetNorm));
};

// Enhanced document comparison with both basic and AI methods
export const compareDocumentsWithAI = async (sourceText, targetText) => {
  try {
    // First, calculate basic similarity scores
    const basicSimilarity = calculateSimilarityScore(sourceText, targetText);
    const wordFreqSimilarity =
      calculateSemanticSimilarity(
        getWordFrequency(sourceText),
        getWordFrequency(targetText)
      ) * 100;

    // Truncate texts for Gemini analysis
    const truncatedSource = sourceText.substring(0, 10000);
    const truncatedTarget = targetText.substring(0, 10000);

    const prompt = `Analyze these two documents for similarity. Consider:
    1. Key concepts and themes
    2. Main topics covered
    3. Writing style and structure
    4. Semantic meaning
    
    Document 1:
    ${truncatedSource}
    
    Document 2:
    ${truncatedTarget}
    
    Return only a similarity percentage as a number between 0 and 100.`;

    // Get AI-based similarity
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    const similarityMatch = responseText.match(/\d+(\.\d+)?/);
    const aiSimilarity = similarityMatch ? parseFloat(similarityMatch[0]) : 50;

    // Combine all similarity scores with weightings
    const combinedSimilarity =
      basicSimilarity * 0.2 + // 20% weight for basic text similarity
      wordFreqSimilarity * 0.3 + // 30% weight for word frequency analysis
      aiSimilarity * 0.5; // 50% weight for AI analysis

    return Math.min(100, Math.max(0, combinedSimilarity));
  } catch (error) {
    console.error("Error in enhanced document comparison:", error);
    // Fallback to combined basic methods if AI fails
    const basicSimilarity = calculateSimilarityScore(sourceText, targetText);
    const wordFreqSimilarity =
      calculateSemanticSimilarity(
        getWordFrequency(sourceText),
        getWordFrequency(targetText)
      ) * 100;

    return Math.min(
      100,
      Math.max(0, basicSimilarity * 0.4 + wordFreqSimilarity * 0.6)
    );
  }
};

// Topic detection using Gemini
export const detectDocumentTopics = async (text) => {
  try {
    const truncatedText = text.substring(0, 10000);
    const prompt = `Analyze this text and:
    1. Identify the main topics (maximum 5)
    2. Provide a confidence score (0-100) for each topic
    3. Format as JSON array with 'topic' and 'confidence' keys
    
    Text:
    ${truncatedText}`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    let topics = JSON.parse(response.text());

    // Ensure proper format and limits
    topics = topics
      .filter((t) => t.topic && t.confidence)
      .map((t) => ({
        topic: t.topic.trim(),
        confidence: Math.min(100, Math.max(0, t.confidence)),
      }))
      .slice(0, 5);

    return topics;
  } catch (error) {
    console.error("Error detecting topics:", error);
    // Fallback to basic topic detection
    return detectBasicTopics(text);
  }
};

// Basic topic detection as fallback
const detectBasicTopics = (text) => {
  const wordFreq = getWordFrequency(text);

  // Sort words by frequency
  const sortedWords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word, count]) => ({
      topic: word,
      confidence: (count / Object.keys(wordFreq).length) * 100,
    }));

  return sortedWords;
};

// Read text from file (your existing function)
export const readTextFromFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};
