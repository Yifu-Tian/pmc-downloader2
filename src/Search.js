import React, { useState, useEffect } from 'react';
import ProxyModal from './ProxyModal';
import './styles.css';

const Search = () => {
  const [authorName, setAuthorName] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [citations, setCitations] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloadComplete, setIsDownloadComplete] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const checkProxy = async () => {
    try {
      const response = await fetch('https://cors-anywhere.herokuapp.com/');
      return response.ok;
    } catch (error) {
      console.error('Error checking proxy:', error);
      return false;
    }
  };
  useEffect(() => {
    const detectProxy = async () => {
      const isProxySet = await checkProxy();
      setUseProxy(isProxySet);
      setShowModal(true);
    };

    detectProxy();

  }, []);

  const fetchArticles = async (query, start) => {
    const targetUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=${query}&retmax=50&retstart=${start}`;

    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "application/xml");
      const ids = xmlDoc.querySelectorAll("Id");
      return Array.from(ids).map(id => id.textContent);
    } catch (error) {
      throw error;
    }
  };
  const getCitations = async (pmcids) => {
    const citations = {};
    const delay = 250;
    console.log("length:", pmcids.length);
    for (const pmcid of pmcids){
      try{
        await new Promise(resolve => setTimeout(resolve, delay));
	const response = await fetch(`https://api.ncbi.nlm.nih.gov/lit/ctxp/v1/pmc/?format=citation&contenttype=json&id=${pmcid}`);
	if (!response.ok) {
	  throw new Error(`HTTP error! Status: ${response.status}`);
        }
	const data = await response.json();
        citations[pmcid] = data.apa.orig;
	} catch (error) {
	  console.error(`Error fetching citation for PMCID: ${pmcid}`, pmcid, error);
	  citations[pmcid] = 'Error fetching citation';
        }
    };
    return citations;
};

  const searchArticlesByAuthor = async () => {
    setError('');
    setLoading(true);
    setArticles([]);
    setIsDownloadComplete(false);
    setShowProgress(false); // 隐藏下载进度
    setSearchProgress(0); // 重置搜索进度
    const query = encodeURIComponent(authorName.trim() + '[AUTH]');
    let start = 0;
    let ids = [];
    try {
      while (true) {
        const newIds = await fetchArticles(query, start);
        if (newIds.length === 0) {
          break;
        }
        ids = ids.concat(newIds);
	setSearchProgress(ids.length);
        start += 50;
      
      }
    let citations = await getCitations(ids);
    setArticles(ids.map(pmcid => ({
        pmcid,
	citation: citations[pmcid],
        downloadUrl: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/pdf/`,
      })));
    } catch (error) {
      setError(`Failed to fetch articles: ${error.message}`);
    } finally {
      setLoading(false);
    }
};
  const handleDownloadClick = async (articleId, articleTitle) => {
    // 这里使用了Cors Anywhere代理服务
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const targetUrl = `https://www.ncbi.nlm.nih.gov/pmc/articles/${articleId}/pdf/`;
    const apiUrl = proxyUrl + targetUrl;

    setLoading(true);

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        setLoading(false);
	      // 使用Blob对象创建下载链接
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${articleTitle}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
	  console.error('adding to retry list.');
          setLoading(false);
          setError(`Download failed: ${error.message}`);
	  return false;
	})
      return true;
  };

  const handleDownloadAllClick = async () => {
    const retryList = [];
    setDownloadProgress(0);
    setShowProgress(true);
    for (const [index, article] of articles.entries()) {
      try {
        await new Promise(resolve => setTimeout(resolve, index * 100));
        const success = await handleDownloadClick(article.pmcid, article.citation);
	if (!success) {
          retryList.push(article);
	}
      } catch (error) {
          console.error('Download failed: ', error.message);
	  retryList.push(article);
      }
      setDownloadProgress(prev => prev + 1);
    };
    console.log('retry list: ', retryList);
    for (const article of retryList) {
      let success = false;
      while (!success){
        try {
          await new Promise(resolve => setTimeout(resolve, 60000)); // 等待60秒重试
          success = await handleDownloadClick(article.pmcid, article.citation);
	  setDownloadProgress(prev => prev + 1);
      } catch (error) {
          console.error('Retry failed:', error.message);
      }
      }
    }
    setIsDownloadComplete(true);
  };
  const handleConfirm = () => {
    setUseProxy(true);
    setShowModal(false);
  };
  const handleClose = () => {
    setUseProxy(false);
    setShowModal(false);
  }
  const listItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    padding: '10px 0', 
};
  const citationStyle = {
    flexGrow: 1,
    marginRight: '10px', 
    fontSize: '0.8rem', 
};
  const buttonStyle = {
    padding: '5px 10px', 
    fontSize: '0.8rem', 
};
  const searchButtonStyle = {
    marginRight: '20px',
};
  const downloadAllStyle = {
    marginRight: '20px',
};
  const unlockAccess = () => {
    window.open('https://cors-anywhere.herokuapp.com/corsdemo', '_blank');
};

  return (
    <div className="search-container">
      <input
	  type="text"
	  value={authorName}
	  onChange={(e) => setAuthorName(e.target.value)}
	  placeholder="Enter author's name"
      />
      <button style={searchButtonStyle} onClick={searchArticlesByAuthor}>Search</button>
      <button style={downloadAllStyle} onClick={handleDownloadAllClick} disabled={articles.length === 0}>
	  Download All Articles
      </button>
      <ProxyModal show={showModal} onClose={handleClose} onConfirm={handleConfirm} useProxy={useProxy}/>
      {searchProgress > 0 && (
           <div>
                 Articles found: {searchProgress}
           </div>
         )}
      {showProgress && (
            <div>
              Download progress: {downloadProgress}/{articles.length}
            </div>
      )}
      {isDownloadComplete && <div>Download complete!</div>}
      <ul className="articles-list">
	  {articles.map((article, index)=>(
	    <li key={index} style={listItemStyle}>
	      <a href={article.downloadUrl} 
                  style={{ color: 'white', textDecoration: 'none', fontSize: '10px' }}
		  target="_blank" rel="noopener noreferrer">
		  
		  {article.citation}
	      </a>
	        <button onClick={() => handleDownloadClick(article.pmcid, article.downloadUrl)} style={{ padding: '5px 10px', fontSize: '12px' }}>
		  Download PDF
		</button>
	      </li>

	  ))}
	</ul>
	 {error && <div className="error-message">{error}</div>}
	 {loading && <div>Loading...</div>}
      </div>
  );
};


export default Search;

