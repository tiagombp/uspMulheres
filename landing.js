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

    structure : {

        init : function() {

            const data = vis.data.raw;
            const grupos = Object.keys(data);


            function build_grupo(grupo) {

                if (grupo == "facetas") return;

                console.log("Montando grupo: ", grupo);

                const grupo_element = document.querySelector("article[data-grupo='" + grupo + "']");

                const codigos_perguntas = Object.keys(data[grupo]);
    
                codigos_perguntas.forEach(codigo_pergunta => {
    
                    grupo_element.appendChild(vis.structure.build.common(grupo, codigo_pergunta));
    
                })

            }

            grupos.forEach(grupo => build_grupo(grupo));

        },

        build : {

            // comun para todas as perguntas

            "common" : function(grupo, codigo_pergunta) {

                const data = vis.data.raw[grupo][codigo_pergunta];

                const pergunta = data.nome_completo;

                const section = document.createElement("section");
                section.dataset.pergunta = pergunta;

                const h2 = document.createElement("h2");
                h2.innerText = pergunta + " (" + codigo_pergunta + ")";

                section.appendChild(h2);

                const tipo_pergunta = data.tipo[0];

                section.appendChild(vis.structure.build[tipo_pergunta](data));

                return section;

            },

            // especificidades de cada tipo de pergunta

            "simples" : function(data) {

                const container = document.createElement("div");
                container.classList.add("svg-container");

                const svg = document.createElement("svg");

                container.appendChild(svg);

                return container;
            },

            "multiplas com escala" : function(data) {

                function build_sub_pergunta(sub_pergunta) {

                    const section = document.createElement("section");
                    section.dataset.sub_pergunta = sub_pergunta;

                    const h3 = document.createElement("h3");
                    h3.innerText = sub_pergunta;

                    section.appendChild(h3);

                    const container = document.createElement("div");
                    container.classList.add("svg-container");
    
                    const svg = document.createElement("svg");
                    container.appendChild(svg);

                    section.appendChild(container);

                    return section;

                }

                const container_sub_perguntas = document.createElement("div");

                const sub_perguntas = Object.keys(data.dados);

                sub_perguntas.forEach(sub_pergunta => {

                    container_sub_perguntas.appendChild(
                        build_sub_pergunta(sub_pergunta)
                    )

                })

                return container_sub_perguntas;

            }

        }

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
