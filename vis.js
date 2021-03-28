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
            largura : 2,
            altura : 2

        }

    },

    dims : {

        vis : null,
        seletor : null

    },

    data : null,

    utils : {

        sizings : {

            get_vsizes : function() {

                const sizes = ["vis", "seletor"];

                sizes.forEach(size => {
                    
                    vis.dims[size] = vis.sels[size].node().getBoundingClientRect().height;

                })

                console.log(vis.dims);

            },

            set_vsize_svg : function() {

                const svg_height = vis.dims.vis - vis.dims.seletor;

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

    render : {},

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

            // here it goes.

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