const vis = {

    data : {

        raw : null,

        load : function() {

            fetch("./output.json", {mode: 'cors'})
              .then( response => response.json())
              .then( data => vis.ctrl.begin(data))
              .catch( error => console.log( error ) );

        }


    },

    tabs : {

        refs : {

            tabs : '[role="tab"]',
            tablist : '[role="tablist"]'

        },

        monitor : function() {

            console.log('monitoring...');

            window.addEventListener("DOMContentLoaded", () => {

                const tabs = document.querySelectorAll(this.refs.tabs);
                const tabList = document.querySelector(this.refs.tablist);
              
                // Add a click event handler to each tab
                tabs.forEach(tab => {
                    //console.log("handler", tab);
                    tab.addEventListener("click", this.changeTabs);
                });
              
                // Enable arrow navigation between tabs in the tab list
                let tabFocus = 0;
              
                tabList.addEventListener("keydown", e => {
                  // Move right
                  if (e.keyCode === 39 || e.keyCode === 37) {
                    tabs[tabFocus].setAttribute("tabindex", -1);
                    if (e.keyCode === 39) {
                      tabFocus++;
                      // If we're at the end, go to the start
                      if (tabFocus >= tabs.length) {
                        tabFocus = 0;
                      }
                      // Move left
                    } else if (e.keyCode === 37) {
                      tabFocus--;
                      // If we're at the start, move to the end
                      if (tabFocus < 0) {
                        tabFocus = tabs.length - 1;
                      }
                    }
              
                    tabs[tabFocus].setAttribute("tabindex", 0);
                    tabs[tabFocus].focus();
                  }
                });
            });

        },
            
        changeTabs : function(e) {

            const target = e.target;
            const parent = target.parentNode;
            const grandparent = parent.parentNode;

            console.log("CLicked", target);
            
            // Remove all current selected tabs
            parent
                .querySelectorAll('[aria-selected="true"]')
                .forEach(t => t.setAttribute("aria-selected", false));
            
            // Set this tab as selected
            target.setAttribute("aria-selected", true);
            
            // Hide all tab panels
            grandparent
                .querySelectorAll('[role="tabpanel"]')
                .forEach(p => p.setAttribute("hidden", true));
            
            // Show the selected panel
            grandparent.parentNode
                .querySelector(`#${target.getAttribute("aria-controls")}`)
                .removeAttribute("hidden");
        },

    },

    ctrl : {

        monitors : () => {

            vis.tabs.monitor();

        },

        init : () => {

            vis.ctrl.monitors();

            vis.data.load();

        },

        begin: (data) => {

            vis.data.raw = data;

        }

    }

}

vis.ctrl.init();
