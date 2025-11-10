import React, { useState, useEffect } from 'react';

function App() {
  const [apiToken, setApiToken] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoTime, setVideoTime] = useState(5);
  const [modelType, setModelType] = useState('I2V');
  const [promptText, setPromptText] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, chaotic, deformed, watermark, bad anatomy, shaky camera view point');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [extendPrompt, setExtendPrompt] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskData, setTaskData] = useState(null);
  const [videoResults, setVideoResults] = useState([]);
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
    setVideoResults([]);
    setStatus('Initiating generation...');
    setErrorMessage('');

    const directImageUrl = convertToDirectUrl(imageUrl);

    try {
      // Using the CORRECT API endpoint from documentation
      const response = await fetch('https://video.a2e.ai/api/v1/userImage2Video/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({
          name: `Video_${new Date().toLocaleString()}`,
          image_url: directImageUrl,
          prompt: promptText || 'high quality, clear, cinematic',
          negative_prompt: negativePrompt,
          model_type: modelType,
          video_time: videoTime,
          extend_prompt: extendPrompt,
          number_of_images: numberOfImages
        })
      });

      const data = await response.json();

      if (data.code === 0 && data.data) {
        setTaskData(data.data);
        setStatus('Video generation started! Task created successfully.');
        
        // Start checking status after 10 seconds
        setTimeout(() => checkStatus(), 10000);
      } else {
        throw new Error(data.message || 'Failed to start video generation');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(`Error: ${error.message}`);
      setStatus('');
      setIsGenerating(false);
    }
  };

  const checkStatus = async () => {
    if (!apiToken) {
      setErrorMessage('API token missing');
      return;
    }

    try {
      const response = await fetch('https://video.a2e.ai/api/v1/userImage2Video/allRecords', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.code === 0 && data.data) {
        // Sort by creation date to get most recent first
        const sortedVideos = data.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setVideoResults(sortedVideos);
        
        // Check if the most recent task is still processing
        const latestTask = sortedVideos[0];
        if (latestTask) {
          if (latestTask.current_status === 'completed') {
            setStatus('Video generation completed!');
            setIsGenerating(false);
          } else if (latestTask.current_status === 'failed') {
            setStatus('Generation failed: ' + (latestTask.failed_message || 'Unknown error'));
            setIsGenerating(false);
          } else {
            setStatus(`Status: ${latestTask.current_status}... Checking again in 10 seconds...`);
            // Continue checking
            setTimeout(() => checkStatus(), 10000);
          }
        }
      } else {
        setErrorMessage('Failed to fetch video status');
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Status check error:', error);
      setErrorMessage(`Error checking status: ${error.message}`);
      setStatus('');
      setIsGenerating(false);
    }
  };

  // Manual status check
  const manualCheckStatus = () => {
    setStatus('Checking status...');
    checkStatus();
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
            placeholder="Enter your Bearer token"
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
            Model Type
          </label>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          >
            <option value="I2V">I2V (Standard)</option>
            <option value="GENERAL">General</option>
            <option value="FLF2V">FLF2V (First-Last Frame)</option>
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

        {/* Extend Prompt */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Extend Prompt
          </label>
          <select
            value={extendPrompt}
            onChange={(e) => setExtendPrompt(e.target.value === 'true')}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          >
            <option value="true">Yes (AI Enhanced)</option>
            <option value="false">No (Use Exact Prompt)</option>
          </select>
        </div>
      </div>

      {/* Prompt Section */}
      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
          Prompt (describe the motion you want)
        </label>
        <textarea
          placeholder="Example: high quality, clear, cinematic, person waving hand"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', resize: 'vertical' }}
        />
      </div>

      {/* Negative Prompt Section */}
      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
          Negative Prompt (what to avoid)
        </label>
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          rows={2}
          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', resize: 'vertical' }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={generateVideo}
          disabled={isGenerating || !apiToken || !imageUrl}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: isGenerating || !apiToken || !imageUrl ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: isGenerating || !apiToken || !imageUrl ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Video'}
        </button>
        
        <button
          onClick={manualCheckStatus}
          disabled={!apiToken}
          style={{
            padding: '12px 24px',
            backgroundColor: !apiToken ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: !apiToken ? 'not-allowed' : 'pointer'
          }}
        >
          Check Status
        </button>
      </div>

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

      {/* Video Results */}
      {videoResults.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: '500' }}>Your Videos:</h3>
          {videoResults.slice(0, 5).map((video, index) => (
            <div key={video._id} style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>{video.name || `Video ${index + 1}`}</strong>
                <span style={{ 
                  marginLeft: '10px', 
                  padding: '2px 8px', 
                  backgroundColor: video.current_status === 'completed' ? '#10b981' : 
                                   video.current_status === 'failed' ? '#ef4444' : '#f59e0b',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {video.current_status}
                </span>
              </div>
              
              {video.video_url && (
                <div>
                  <video 
                    controls 
                    style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }}
                    src={video.video_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                  <div style={{ marginTop: '10px' }}>
                    <a 
                      href={video.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'inline-block', 
                        padding: '8px 16px', 
                        backgroundColor: '#3b82f6', 
                        color: 'white', 
                        textDecoration: 'none', 
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      Download Video
                    </a>
                  </div>
                </div>
              )}
              
              {video.failed_message && (
                <p style={{ color: '#ef4444', marginTop: '10px', fontSize: '14px' }}>
                  Error: {video.failed_message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;