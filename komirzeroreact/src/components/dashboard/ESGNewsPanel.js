import React from 'react';

const mockNewsData = [
  {
    id: 1,
    title: 'Global Leaders Announce New ESG Initiatives at Summit',
    source: 'ESG Today',
    imageUrl: 'https://picsum.photos/seed/esg1/400/200', 
    link: 'https://www.esgtoday.com',
    date: '2024-03-15'
  },
  {
    id: 2,
    title: 'Major Corporations Pledge Net-Zero by 2040',
    source: 'ESG News',
    imageUrl: 'https://picsum.photos/seed/esg2/400/200',
    link: 'https://www.esgnews.com',
    date: '2024-03-14'
  },
  {
    id: 3,
    title: 'Innovations in Sustainable Packaging Driving Change',
    source: 'GreenBiz',
    imageUrl: 'https://picsum.photos/seed/esg3/400/200',
    link: 'https://www.esgtoday.com',
    date: '2024-03-13'
  },
  {
    id: 4,
    title: 'Report Highlights Growing Investor Demand for ESG Transparency',
    source: 'ESG Today',
    imageUrl: 'https://picsum.photos/seed/esg4/400/200',
    link: 'https://www.esgnews.com',
    date: '2024-03-12'
  },
  {
    id: 5,
    title: 'The Rise of Impact Investing in Emerging Markets',
    source: 'ESG News',
    imageUrl: 'https://picsum.photos/seed/esg5/400/200',
    link: 'https://www.esgtoday.com',
    date: '2024-03-11'
  },
  {
    id: 6,
    title: 'New Regulatory Framework for Carbon Reporting Proposed',
    source: 'Climate Wire',
    imageUrl: 'https://picsum.photos/seed/esg6/400/200',
    link: 'https://www.esgnews.com',
    date: '2024-03-10'
  }
];

const ESGNewsPanel = () => {
  return (
    <div className="esg-news-panel bg-white p-4 rounded-lg shadow-lg h-full overflow-y-auto">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">ESG News & Updates</h2>
      <div className="space-y-4">
        {mockNewsData.map((item) => (
          <a 
            key={item.id} 
            href={item.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block p-3 rounded-md hover:bg-gray-100 transition-colors duration-150 shadow hover:shadow-md border border-gray-200"
          >
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="w-full h-32 object-cover rounded-md mb-2" />
            ) : (
              <div className="w-full h-20 bg-gray-200 rounded-md mb-2 flex items-center justify-center">
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}
            <h3 className="text-sm font-semibold text-blue-600 hover:text-blue-700 mb-1">{item.title}</h3>
            <p className="text-xs text-gray-500">{item.source} - {item.date}</p>
          </a>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4 pt-2 border-t">
        Note: News content is illustrative. For live updates, integration with a news API is recommended.
      </p>
    </div>
  );
};

export default ESGNewsPanel; 