import toast from 'react-hot-toast';

export const exportToCSV = (data, filename) => {
  if (!data || !data.length) {
    toast.error("No data to export");
    return;
  }

  // Get headers
  const headers = Object.keys(data[0]);
  
  // Convert objects to CSV string
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data
  for (const row of data) {
    const values = headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      // Escape quotes and commas
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
