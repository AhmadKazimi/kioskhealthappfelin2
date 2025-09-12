/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

type ScanResultsProps = {
    results: any;
    allResults: any;
};

const ScanResults: React.FC<ScanResultsProps> = ({ results, allResults }) => {
  return (
    <div id="results" style={{ color: 'red', padding: '10px' }}>
        <h2>Latest Scan Results:</h2>
        <pre>${JSON.stringify(results, null, 2)}</pre>
        <h3>Previous Scans:</h3>
        <pre>${JSON.stringify(allResults, null, 2)}</pre>
    </div>
  );
};

export default ScanResults;