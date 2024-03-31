import React, { useState } from 'react';

function Search() {
  const [authorName, setAuthorName] = useState('');

  const handleSearch = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/download_articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ author_name: authorName }),
      });
      if (response.ok) {
        // 这里假设后端发送了一些JSON响应，例如下载进度或确认信息
        const data = await response.json();
        console.log(data);
        // 处理后端的响应数据，如显示下载状态或链接
      } else {
        // 处理错误
        console.error('Response was not ok.', response);
      }
    } catch (error) {
      // 处理异常
      console.error('There was a problem with the fetch operation:', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Enter author's name"
        />
        <button type="submit">Download Articles</button>
      </form>
    </div>
  );
}

export default Search;

