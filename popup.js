
let options = {

    main:  function () {

        optionsMenuItem = document.getElementById("options-menu-item");
        optionsMenuItem.addEventListener("click", (e) => {
            chrome.runtime.openOptionsPage();
        });

        closeMenuItem = document.getElementById("close-menu-item");
        closeMenuItem.addEventListener("click", (e) => {
            window.close();
        });

        closeButton = document.getElementById("close-x");
        closeButton.addEventListener("click", (e) => {
            window.close();
        });


    }


};

options.main();
