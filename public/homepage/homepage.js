(async function renderHomepageRecipes() {
    let fetchRecipe = `/api/recipes?size=9&filter=likes&direction=desc`;
    const response = await fetch(fetchRecipe);
    const result = await response.json();
    let currentForBig = 0;
    result.recipes.map((recipe,index) => {

        //big size carousel
        if (index % 3 == 0){
            $(".carousel-inner").append(
                `<div id = "item${index}"  class="carousel-item  col-12 big-item-container">
                    <div id = "block${index}" class="row item-container-row"></div>      
                </div>`
            );
            currentForBig = index;
        }
        $(`#block${currentForBig}`).append(
            `<div class="col-3 recipe-carusel-item">
                <a href="./recipes/${recipe.name}">
                    <div id = 'img-size-${recipe.id}' class="img-size"></div>
                </a>
                <div class="image-name">
                    <p>${recipe.name}</p>
                </div>
            </div>`
        )
        $(`#img-size-${recipe.id}`).css('background-image', `url(./../global/images/${recipe.img}.jpg)`);
        $("#item0").addClass("active");

        //medium size carousel
        $(".carousel-inner-medium").append(
            `<div id = "medium-item${index}" class="carousel-item col-11 medium-carousel-style">
                <div class=" recipe-carusel-item">
                    <a href="./recipes/${recipe.name}"> 
                        <div id='small-image-${recipe.id}' class="img-size"></div>
                    </a>
                    <div class="image-name">
                        <p>${recipe.name}</p>
                    </div>
                </div>
                </div>`
        );
        $(`#small-image-${recipe.id}`).css('background-image',`url(./../global/images/${recipe.img}.jpg)`);
        $("#medium-item0").addClass("active"); 
    })
})();