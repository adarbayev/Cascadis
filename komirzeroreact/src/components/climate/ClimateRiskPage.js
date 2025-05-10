const runMockAnalysis = () => {
  setIsLoading(true);
  // Simulate API call
  setTimeout(() => {
    const analysisData = {};
    sites.forEach(site => {
      analysisData[site.id] = {};
      selectedRisks.forEach(riskKey => {
        const probability = Math.random(); // 0-1
        const impact = Math.random();    // 0-1
        analysisData[site.id][riskKey] = {
          probability,
          impact,
          riskIndex: probability * impact, // Simple risk index
          level: getRiskLevel(probability * impact) // Determine level based on index
        };
      });
    });
    setCurrentAnalysisData(analysisData);
    setIsLoading(false);
    setActiveMainTab('riskAnalysis'); // Switch to Risk Analysis tab
  }, 1500);
}; 