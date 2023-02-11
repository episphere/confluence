export function showPreview(file_id, div_id = "boxFilePreview") {

    const access_token = JSON.parse(localStorage.parms).access_token;
  
    try {
  
      let previewContainer = document.getElementById(div_id);
  
      var preview = new Box.Preview();
  
      preview.show(file_id, access_token, {
  
        container: previewContainer,
  
        showDownload: true,
  
        header: "light",
  
      });
  
    } catch (error) {
  
      console.error(error);
  
    }
  
  }
  
  
  
  export function updatePreview(id) {
  
    const access_token = JSON.parse(localStorage.parms).access_token;
  
  }