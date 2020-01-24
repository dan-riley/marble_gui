window.openPage = function (pageName, k=-1 ){
    // Hide all elements with class="tabcontent" by default */
    var tabcontent;

    // Sets all tabs to be hidden
    tabcontent = document.getElementsByClassName("tabcontent");
    let tabcontentLength = tabcontent.length;
    for (let i = 0; i < tabcontentLength; i++) {
        tabcontent[i].style.display = "none";
    }

    // show what page we are on in navigation
    $('.active').removeClass('active');
    $('#' + pageName + '_nav_link').addClass('active');

    // Show the specific tab content
    document.getElementById(pageName).style.display = "block";
}
