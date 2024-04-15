import React, { useState } from 'react';

const Search = () => {
  const [authorName, setAuthorName] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [citations, setCitations] = useState({});

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
  const fetchCitation = async (pmcid) => {
    const proxy = 'https://cors-anywhere.herokuapp.com/';
    const url = `${proxy}https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi?id=${pmcid}`;
    try {
      const response = await fetch(url, {
        headers: {
          'x-requested-with': 'XMLHttpRequest'
	}
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "application/xml");
      const errorNode = xmlDoc.querySelector("error");
      if (errorNode && errorNode.textContent.includes("is not Open Access")) {
        return `PMC${pmcid} is not open access`;
      }

      const citation = xmlDoc.querySelector("record[citation]").getAttribute("citation");
      return citation;

    } catch (error) {
      console.error('Error fetching citation for PMCID: ', pmcid, error);
      return "Error fetching citation";
    }

  };

  const searchArticlesByAuthor = async () => {
    setError('');
    setLoading(true);
    setArticles([]);
    
    const query = encodeURIComponent(authorName.trim() + '[AUTH]');
 
    try {
      let start = 0;
      let ids = [];
      while (true) {
        const newIds = await fetchArticles(query, start);
        if (newIds.length === 0) {
          break;
        }
        ids = ids.concat(newIds);
        start += 50;
      }
    ids.forEach(async (pmcid) => {
      const citation = await fetchCitation(pmcid);
      setCitations(prevCitations => ({ ...prevCitations, [pmcid]: citation }));
    });
    setArticles(ids.map(pmcid => ({
        pmcid,

        citation: citations[pmcid],  // 初始化citation为占位符
        downloadUrl: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/pdf/`,
      })));
    } catch (error) {
      setError(`Failed to fetch articles: ${error.message}`);
    } finally {
      setLoading(false);
    }
};
  const handleDownloadClick = (articleId, articleTitle) => {
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
        setLoading(false);
        setError(`Download failed: ${error.message}`);
      });
  };

  const handleDownloadAllClick = () => {
    articles.forEach((article, index) =>{
	setTimeout(() => {
	  handleDownloadClick(article.pmcid, article.citation);
	
	}, index * 1000);
    });
  };

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
      <button onClick={unlockAccess}>Click here to access</button>
      <ul className="articles-list">
	  {articles.map((article, index)=>(
	    <li key={index} style={listItemStyle}>
	      <span>{citations[article.pmcid]}</span>
	        <button onClick={() => handleDownloadClick(article.pmcid, citations[article.pmcid])}>
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

