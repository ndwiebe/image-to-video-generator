import React, { useState, useEffect } from 'react';

function App() {
  const [apiToken, setApiToken] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [promptText, setPromptText] = useState('the person is speaking. Looking at the camera. detailed eyes, clear teeth, static view point, still background');
  const [negativePrompt, setNegativePrompt] = useState('six fingers, bad hands, lowres, low quality, worst quality, moving view point, static image');
  const [videoTime, setVideoTime] = useState(5); // NEW: video length
  const [extendPrompt, setExtendPrompt] = useState(true); // NEW: extend prompt option
  const [isGenerating, setIsGenerating] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
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
    // ImgBB URLs are already direct - no conversion needed
    if (url.includes('ibb.co') || url.includes('imgbb.com')) {
      return url;
    }
    
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
    if (!apiToken) {
      setErrorMessage('Please provide API token');
      return;
    }
    if (!imageUrl) {
      setErrorMessage('Please provide image URL');
      return;
    }

    setIsGenerating(true);
    setStatus('Preparing request...');
    setErrorMessage('');
    setDebugInfo('');

    const directImageUrl = convertToDirectUrl(imageUrl);
    
    // Use EXACT format from official documentation - NOW WITH ALL FIELDS
    const requestBody = {
      name: `Video_${Date.now()}`,
      image_url: directImageUrl,
      prompt: promptText,
      negative_prompt: negativePrompt,
      video_time: videoTime,           // ADDED
      extend_prompt: extendPrompt      // ADDED
    };

    // Log the request for debugging
    const debugRequest = {
      endpoint: 'https://video.a2e.ai/api/v1/userImage2Video/start',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken.substring(0, 20)}...`
      },
      body: requestBody
    };

    setDebugInfo('REQUEST:\n' + JSON.stringify(debugRequest, null, 2));
    setStatus('Sending request to A2E.ai...');

    try {
      const response = await fetch('https://video.a2e.ai/api/v1/userImage2Video/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify(requestBody)
      });

      // Get response text first
      const responseText = await response.text();
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // If not JSON, show the raw response
        setDebugInfo(prev => prev + '\n\nRESPONSE (not JSON):\n' + responseText);
        throw new Error('Server returned non-JSON response: ' + responseText.substring(0, 200));
      }

      // Log the response
      setDebugInfo(prev => prev + '\n\nRESPONSE:\n' + JSON.stringify(data, null, 2));

      if (response.ok && data.code === 0) {
        setStatus('✅ Video generation started successfully!');
        setErrorMessage('');
      } else {
        const errorMsg = data.message || data.msg || data.error || 'Unknown error';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error details:', error);
      setErrorMessage(`❌ Error: ${error.message}`);
      setStatus('Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Test the API connection
  const testConnection = async () => {
    if (!apiToken) {
      setErrorMessage('Please enter API token first');
      return;
    }

    setStatus('Testing API connection...');
    setErrorMessage('');
    setDebugInfo('');

    try {
      const response = await fetch('https://video.a2e.ai/api/v1/userImage2Video/allRecords', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        setDebugInfo('API Test Response (not JSON):\n' + responseText);
        throw new Error('API returned non-JSON response');
      }

      setDebugInfo('API Test Response:\n' + JSON.stringify(data, null, 2));

      if (response.ok) {
        setStatus('✅ API connection successful!');
        if (data.data) {
          setStatus(prev => prev + ` Found ${data.data.length} existing videos.`);
        }
      } else {
        throw new Error(`API Error ${response.status}: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      setErrorMessage(`❌ Connection test failed: ${error.message}`);
      setStatus('');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif' }}>
      <h1 style={{ textAlign: 'center', fontSize: '32px', marginBottom: '10px', color: '#1f2937' }}>
        🎬 Image to Video Generator
      </h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        Transform images of people into videos with AI
      </p>
      
      {/* API Token Section */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Step 1: API Token</h3>
        <p style={{ fontSize: '14px', marginBottom: '10px' }}>
          Paste your API token from A2E.ai (just the token, without "Bearer")
        </p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder='sk_eyJhbGci...'
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'monospace' }}
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
        <button
          onClick={testConnection}
          disabled={!apiToken}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: !apiToken ? '#9ca3af' : '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: !apiToken ? 'not-allowed' : 'pointer' 
          }}
        >
          Test API Connection
        </button>
      </div>

      {/* Image URL Section */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#dbeafe', borderRadius: '8px', border: '1px solid #3b82f6' }}>
        <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Step 2: Upload Your Image (Must Have a Person's Face)</h3>
        
        <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '14px' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: '600', color: '#92400e' }}>
            ⚠️ Important: This API only works with images of PEOPLE
          </p>
          <p style={{ margin: '0', color: '#78350f' }}>
            Your image must contain a clear human face. Landscapes, objects, or animals will not work.
          </p>
        </div>

        {/* ImgBB Instructions */}
        <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', fontSize: '14px' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: '600', color: '#1f2937' }}>
            📸 Recommended: Use ImgBB (Free, No Account Needed)
          </p>
          <ol style={{ margin: '5px 0', paddingLeft: '20px', color: '#4b5563' }}>
            <li>Go to <a href="https://imgbb.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>ImgBB.com</a></li>
            <li>Click "Start uploading" and upload your image</li>
            <li>Click "Direct links" in the dropdown</li>
            <li>Copy the URL (should look like: https://i.ibb.co/xxxxx/image.jpg)</li>
            <li>Paste it below</li>
          </ol>
        </div>

        <input
          type="text"
          placeholder="https://i.ibb.co/xxxxx/your-image.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '5px' }}
        />
        
        {imageUrl && (
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '8px', padding: '8px', backgroundColor: '#d1fae5', borderRadius: '4px' }}>
            {imageUrl.includes('ibb.co') ? (
              <>✅ Perfect! ImgBB URL detected</>
            ) : imageUrl.includes('drive.google.com') ? (
              <>⚠️ Warning: Google Drive links may not work. Consider using ImgBB instead.</>
            ) : (
              <>Using: {convertToDirectUrl(imageUrl)}</>
            )}
          </div>
        )}
      </div>

      {/* Video Settings Section - NEW */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #22c55e' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Step 3: Video Settings</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Video Length:</label>
          <select
            value={videoTime}
            onChange={(e) => setVideoTime(Number(e.target.value))}
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={15}>15 seconds</option>
          </select>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0' }}>
            Choose how long your video will be
          </p>
        </div>

        <div style={{ marginBottom: '0' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={extendPrompt}
              onChange={(e) => setExtendPrompt(e.target.checked)}
              style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: '600' }}>Extend Prompt</span>
          </label>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0', paddingLeft: '26px' }}>
            Let the AI automatically enhance your prompt for better results (recommended)
          </p>
        </div>
      </div>

      {/* Prompt Section */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Step 4: Customize Prompts (Optional)</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Prompt:</label>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0' }}>
            Describe what you want the person to do (e.g., "speaking and looking at camera")
          </p>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Negative Prompt:</label>
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            rows={2}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0' }}>
            What you don't want (e.g., "blurry, distorted, low quality")
          </p>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateVideo}
        disabled={isGenerating || !apiToken || !imageUrl}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: isGenerating || !apiToken || !imageUrl ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '18px',
          fontWeight: '600',
          cursor: isGenerating || !apiToken || !imageUrl ? 'not-allowed' : 'pointer'
        }}
      >
        {isGenerating ? '⏳ Sending Request...' : '🚀 Generate Video'}
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

      {/* Debug Information */}
      {debugInfo && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
          <h4 style={{ marginTop: 0 }}>Debug Information:</h4>
          <pre style={{ 
            fontSize: '12px', 
            overflow: 'auto', 
            maxHeight: '400px',
            backgroundColor: '#1f2937',
            color: '#10b981',
            padding: '10px',
            borderRadius: '4px'
          }}>
            {debugInfo}
          </pre>
        </div>
      )}

      {/* Help Section */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e0f2fe', borderRadius: '8px', fontSize: '14px' }}>
        <h4 style={{ marginTop: 0 }}>🆘 Troubleshooting:</h4>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li><strong>500 Error:</strong> Check that your image contains a clear human face and you have credits in your A2E.ai account</li>
          <li><strong>401 Error:</strong> Invalid API token. Get a new one from A2E.ai</li>
          <li><strong>Need help?</strong> Contact A2E support at contact@a2e.ai or join their Discord</li>
        </ul>
        
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#ffffff', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: '600' }}>📖 Format Based on Official Documentation</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
            This app now uses the exact request format from A2E.ai's official documentation including video_time and extend_prompt fields.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;