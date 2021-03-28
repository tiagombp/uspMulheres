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

        }

    },

    dims : {

        vis : null,
        seletor : null,
        svg : {

            height : null,
            width: null

        }

    },

    data : null,

    utils : {

        sizings : {

            get_vsizes : function() {

                const sizes = ["vis", "seletor"];

                sizes.forEach(size => {
                    
                    vis.dims[size] = vis.sels[size].node().getBoundingClientRect().height;

                })

                vis.dims.svg.width = vis.sels.svg.node().getBoundingClientRect().width;

                console.log(vis.dims);

            },

            set_vsize_svg : function() {

                const svg_height = vis.dims.vis - vis.dims.seletor;

                vis.dims.svg.height = svg_height;

                vis.sels.svg.attr("height", svg_height);

            }

        },

        read_data : function() {

            d3.csv("./dados.csv").then(function(data) {

                vis.data = data;
                vis.control.begin();

            })

        }
    },

    render : {

        create_rects : function() {

            const qde_dots_maximo = Math.floor((vis.dims.svg.width - 100) / 12);

            vis.sels.rects = vis.sels.svg
              .selectAll("rect.pessoas")
              .data(vis.data)
              .join("rect")
              .classed("pessoas", true)
              .attr("height", vis.params.dots.altura)
              .attr("width", vis.params.dots.largura)
              .attr("x", (d,i) => 50 + ( (i%qde_dots_maximo) * 12 ) )
              .attr("y", (d,i) => 50 + ( (Math.floor(i/qde_dots_maximo)) * 12 ) );

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

            console.log(vis.data.columns);

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