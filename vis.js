const vis = {

    refs : {

        svg : "svg",
        container_svg : "div.container-svg",
        vis : "div.vis",
        seletor : "div.selector"

    },

    sels : {

        svg : null,
        container_svg : null,
        vis : null,
        seletor : null,
        rects : null

    },

    params : {

        dots : {

            qde_fileira : 4,
            largura : 10,
            altura : 10

        },

        palette : ["#ea7393", "#f495ab", "#a8596f", "#ccccc4", "#643b45"]

    },

    dims : {

        vis : null,
        seletor : null,
        svg : {

            height : null,
            width: null

        }

    },

    data : {

        raw : null,
        sumario : null

    },

    utils : {

        sizings : {

            get_vsizes : function() {

                const sizes = ["vis", "seletor"];

                sizes.forEach(size => {

                    const element = vis.sels[size].node()

                    let initial_size = element.offsetHeight; //getBoundingClientRect().height;

                    // usei padding em vez de margins no div do seletor para que o tamanho retornado aqui já esteja correto, sem ter que arrumar um jeito de incorporar o tamanho das margins

                    //let margins = getComputedStyle(element).marginTop + " " + getComputedStyle(element).marginBottom;

                    //console.log(size, " margins: ", margins);
                    
                    vis.dims[size] = initial_size;

                    console.log(size, " tamanho: ", vis.dims[size]);

                })

                vis.dims.svg.width = vis.sels.svg.node().getBoundingClientRect().width;

                console.log(vis.dims);

            },

            set_vsize_svg : function() {

                const svg_height = vis.dims.vis - vis.dims.seletor;

                vis.dims.svg.height = svg_height;

                vis.sels.svg.attr("height", svg_height);
                vis.sels.container_svg.style("height", svg_height + "px");

            },

            convertRemToPixels : function(rem) {    
                return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
            }

        },

        data_processing : {

            sumariza_dados : function(criterio, ordena = false, vetor_ordem) {

                const sumario = [];
                const dados = vis.data.raw;
                let categorias_unicas;
    
                // gera array com os valores únicos dessa variável categórica
            
                if (vetor_ordem) categorias_unicas = vetor_ordem;
                else {
                  categorias_unicas = dados
                    .map(d => d[criterio])
                    .filter((v, i, a) => a.indexOf(v) === i);
                }
            
                // faz a contagem dos casos para cada valor único da variável categórica
            
                for (cat of categorias_unicas) {
                    const cont = dados
                      .filter(d => d[criterio] === cat)
                      .length;
            
                    sumario.push({"categoria" : cat,
                                  "contagem"  : cont,
                                  "criterio"  : criterio});                 
                }
            
                if (ordena) sumario.sort((a,b) => b.contagem - a.contagem);
            
                return sumario;    
    
            },

        

        },

        read_data : function() {

            d3.csv("./dados.csv").then(function(data) {

                vis.data.raw = data;
                vis.control.begin();

            })

        }
    },

    render : {

        create_rects : function() {

            const qde_dots_maximo = Math.floor((vis.dims.svg.width - 100) / 12);

            vis.sels.rects = vis.sels.svg
              .selectAll("rect.pessoas")
              .data(vis.data.raw)
              .join("rect")
              .classed("pessoas", true)
              .attr("height", vis.params.dots.altura)
              .attr("width", vis.params.dots.largura)
              .attr("x", (d,i) => 50 + ( (i%qde_dots_maximo) * 12 ) )
              .attr("y", (d,i) => 50 + ( (Math.floor(i/qde_dots_maximo)) * 12 ) );

        },

        change_colors : function() {

            vis.sels.rects
              .transition()
              .duration(500)
              .attr("fill", d => vis.params.palette[Math.round(Math.random()*4)]);

        }



    },

    control : {

        initialize_selections : function() {

            // lista referencias
            const refs = Object.keys(vis.refs);

            refs.forEach(referencia => {

                vis.sels[referencia] = d3.select(vis.refs[referencia]);

            })

        },

        begin: function() {

            console.log(vis.data.raw.columns);

            // tudo que depende dos dados vai aqui.

            vis.render.create_rects();



        },

        init : function() {

            vis.control.initialize_selections();
            vis.utils.sizings.get_vsizes();
            vis.utils.sizings.set_vsize_svg();
            vis.utils.read_data();

        }

    }

}

vis.control.init();