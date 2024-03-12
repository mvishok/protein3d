let element = document.querySelector('#proteinViewer');
let config = { backgroundColor: 'white' };
let viewer = $3Dmol.createViewer(element, config);

function load() {
  // Get search query from input with id "searchInput"
  const searchInput = document.querySelector('#searchInput').value;

  // Define the search query and encode it
  const encodedSearchInput = encodeURIComponent(searchInput);
  const searchQuery = `{"query": {"type": "terminal", "service": "full_text", "parameters": {"value": "${encodedSearchInput}"}}, "return_type": "entry"}`;

  // Set the API endpoint URL
  const searchUrl = `https://search.rcsb.org/rcsbsearch/v2/query?json=${encodeURIComponent(searchQuery)}`;

  // Send the GET request for search
  fetch(searchUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Extract the top identifier from the search response
      const topIdentifier = data.result_set[0].identifier;
      console.log("Top Identifier: " + topIdentifier);

      // Construct PDB file URL
      const pdbUrl = `https://files.rcsb.org/download/${topIdentifier}.pdb`;

      // Load PDB file and render the structure
      loadPDB(pdbUrl);

      // Fetch additional details
      const detailsUrl = `https://data.rcsb.org/rest/v1/core/entry/${topIdentifier}`;
      fetch(detailsUrl)
        .then(response => response.json())
        .then(detailsData => {
          // Update HTML elements with relevant details
          document.querySelector('#pname').innerText = "PDB ID: "+detailsData.entry.id;
          const detailsString = getFormattedDetails(detailsData);
          document.querySelector('#pdetails').innerHTML = detailsString;
        })
        .catch(error => {
          console.error('Error fetching details:', error);
        });
    })
    .catch(error => {
      console.error('Error fetching search results:', error);
    });

  // "res" visible
  $('#res').show();
}

function loadPDB(pdbUrl) {
  jQuery.ajax(pdbUrl, {
    success: function (data) {
      let v = viewer;
      v.addModel(data, "pdb");                       /* load data */
      v.setStyle({}, { cartoon: { color: 'spectrum' } });  /* style all atoms */
      v.zoomTo();                                      /* set camera */
      v.render();                                      /* render scene */
      v.zoom(1.2, 1000);                               /* slight zoom */
    },
    error: function (hdr, status, err) {
      console.error("Failed to load PDB " + pdbUrl + ": " + err);
    },
  });
}

function getFormattedDetails(detailsData) {
  const detailsArray = [];

  // Extract relevant details from the response
  const entryDetails = detailsData.entry;
  const citationDetails = detailsData.citation;

  // Add details to the array
  detailsArray.push(`Name: ${entryDetails.id}`);
  detailsArray.push(`Authors: ${getCitationAuthors(citationDetails)}`);
  detailsArray.push(`Year: ${getCitationYear(citationDetails)}`);
  detailsArray.push(`Journal: ${getCitationJournal(citationDetails)}`);

  // Join details with line breaks
  return detailsArray.join('<br>');
}

function getCitationAuthors(citationDetails) {
  // Extract and format authors from citation details
  const authors = citationDetails.map(c => c.rcsb_authors.join(', '));
  return authors.join(', ');
}

function getCitationYear(citationDetails) {
  // Extract and format years from citation details
  const years = citationDetails.map(c => c.year);
  return years.join(', ');
}

function getCitationJournal(citationDetails) {
  // Extract and format journals from citation details
  const journals = citationDetails.map(c => c.rcsb_journal_abbrev);
  return journals.join(', ');
}
