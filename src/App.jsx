import React, { useState, useEffect } from 'react';

function App() {
  const [apiToken, setApiToken] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoTime, setVideoTime] = useState(5);
  const [modelName, setModelName] = useState('Dream Machine');
  const [promptText, setPromptText] = useState('');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationId, setGenerationId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load API token from localStorage on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('a2e_api_token');
    if (savedToken) {
      setApiToken(savedToken);
    }
  }, []);

  // Save API token to localStorage whenever it changes
  useEffect(() => {
    if (apiToken) {
      localStorage.setItem('a2e_api_token', apiToken);
    }
  }, [apiToken]);

  const clearApiToken = () => {
    localStorage.removeItem('a2e_api_token');
    setApiToken('');
    setErrorMessage('API token cleared');
    setTimeout(() => setErrorMessage(''), 3000);
  };

  const convertToDirectUrl = (url) => {
    // Check if it's a Google Drive URL
    const googleDriveMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (googleDriveMatch) {
      return `https://drive.google.com/uc?export=download&id=${googleDriveMatch[1]}`;
    }
    
    // Check if it's a Dropbox URL
    if (url.includes('dropbox.com')) {
      return url.replace('?dl=0', '?dl=1').replace('&dl=0', '&dl=1');
    }
    
    // Return original URL if not Google Drive or Dropbox
    return url;
  };

  const generateVideo = async () => {
    if (!apiToken || !imageUrl) {
      setErrorMessage('Please provide both API token and image URL');
      return;
    }

    setIsGenerating(true);
    setVideoUrl('');
    setStatus('Initiating generation...');
    setErrorMessage('');

    const directImageUrl = convertToDirectUrl(imageUrl);

    try {
      const response = await fetch('https://video.a2e.ai/v1/image_to_video/generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiToken
        },
        body: JSON.stringify({
          image_url: directImageUrl,
          video_time: videoTime,
          model_name: modelName,
          prompt_text: promptText,
          number_of_images: numberOfImages
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      setGenerationId(data.generation_id);
      setStatus('Video generation started! Checking status...');
      
      // Start checking status
      checkStatus(data.generation_id);
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(`Error: ${error.message}`);
      setStatus('');
      setIsGenerating(false);
    }
  };

  const checkStatus = async (genId) => {
    try {
      const response = await fetch(`https://video.a2e.ai/v1/image_to_video/generation/${genId}`, {
        method: 'GET',
        headers: {
          'Authorization': apiToken
        }
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.generation.status === 'completed') {
        setVideoUrl(data.generation.video_url);
        setStatus('Video generation completed!');
        setIsGenerating(false);
      } else if (data.generation.status === 'failed') {
        setStatus('Generation failed. Please try again.');
        setErrorMessage('Video generation failed');
        setIsGenerating(false);
      } else {
        setStatus(`Status: ${data.generation.status}... Checking again in 5 seconds...`);
        // Check again in 5 seconds
        setTimeout(() => checkStatus(genId), 5000);
      }
    } catch (error) {
      console.error('Status check error:', error);
      setErrorMessage(`Error checking status: ${error.message}`);
      setStatus('');
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif' }}>
      <h1 style={{ textAlign: 'center', fontSize: '32px', marginBottom: '40px', color: '#1f2937' }}>
        🎬 Image to Video Generator
      </h1>
      
      {/* API Token Section */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
          API Token {apiToken && '✓ Saved'}
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="password"
            placeholder="Enter your A2E.ai API token"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          />
          {apiToken && (
            <button
              onClick={clearApiToken}
              style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Image URL Section */}
      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
          Image URL (Google Drive links will be auto-converted)
        </label>
        <input
          type="text"
          placeholder="Enter image URL or paste Google Drive link"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
        />
      </div>

      {/* Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Video Duration */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Video Duration
          </label>
          <select
            value={videoTime}
            onChange={(e) => setVideoTime(Number(e.target.value))}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          >
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={15}>15 seconds</option>
          </select>
        </div>

        {/* Model Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Model
          </label>
          <select
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          >
            <option value="Dream Machine">Dream Machine</option>
            <option value="Stable Video">Stable Video</option>
          </select>
        </div>

        {/* Number of Videos */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Number of Videos
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={numberOfImages}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setNumberOfImages(isNaN(value) ? 1 : Math.min(5, Math.max(1, value)));
            }}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          />
        </div>
      </div>

      {/* Prompt Section */}
      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
          Prompt (Optional)
        </label>
        <textarea
          placeholder="Describe the motion or animation you want..."
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', resize: 'vertical' }}
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={generateVideo}
        disabled={isGenerating || !apiToken || !imageUrl}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isGenerating ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: '500',
          cursor: isGenerating ? 'not-allowed' : 'pointer'
        }}
      >
        {isGenerating ? 'Generating...' : 'Generate Video'}
      </button>

      {/* Status Messages */}
      {status && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#dbeafe', borderRadius: '6px', color: '#1e40af' }}>
          {status}
        </div>
      )}

      {errorMessage && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fee2e2', borderRadius: '6px', color: '#b91c1c' }}>
          {errorMessage}
        </div>
      )}

      {/* Generation ID Display */}
      {generationId && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
          <strong>Generation ID:</strong> {generationId}
        </div>
      )}

      {/* Video Display */}
      {videoUrl && (
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: '500' }}>Generated Video:</h3>
          <video 
            controls 
            style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            src={videoUrl}
          >
            Your browser does not support the video tag.
          </video>
          <div style={{ marginTop: '15px' }}>
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '6px' }}
            >
              Download Video
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;