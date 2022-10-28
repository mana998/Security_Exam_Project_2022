//function to create recipe container
function generateRecipe(recipe, container) {
    let imageCol = '';
    if (container === 'recipes-container' || container === 'fridge-recipes-container') {
        imageCol = 'col-md-3';
    } else {
        imageCol = 'col-12';
    }
    return(  
        `<div class="${imageCol} account-recipe-item">
            <a href="/recipes/${recipe.name}" >
                <div id="recipe-block-${recipe.id}" class="img-size"></div>
            </a>
            <div class="image-name">
                <p>${recipe.name}</p>
            </div>
            <div class="image-icons-likes">
                <p class="likes">${recipe.likes}</p>
                <img onclick="addOrDeleteFromFavorite(${recipe.id}, 'heart-icon-${container}-${recipe.id}', '${container}')" id="heart-icon-${container}-${recipe.id}" class="icon" src="./../global/icons/heart.png" alt="heart icon"></img>
                <img onclick="updateModal('${recipe.name}')" id="update-icon-${container}-${recipe.id}" class="icon" src="./../global/icons/update.png" alt="update icon" data-toggle="modal" data-target="#recipeFormModalAdd"></img> 
            </div>
            <p id="recipe_id" hidden>${recipe.id}</p>
            <script>$('#recipe-block-${recipe.id}').css('background-image','url(./../global/images/${recipe.img}.jpg)');</script>
        </div>`
    );
}

//take ingredients from db and add them to the form
async function updateModal(recipe_name) {
    const response = await fetch(`/api/recipes/${recipe_name}`);
    const result = await response.json();
    $("#ingredientsArray").empty();
    $('#img-response').text('');
    $('#modalHeadder').text('Update recipe');
    $('#recipeId').attr("value", result.recipe.id);
    $('#recipe_name').val(result.recipe.name);
    $('#recipe_description').val(result.recipe.description.replace(/^\s*\s/gm,''));
    result.ingredients.map(ingredient => {
        if ($("#ingredientsArray").children().length !== 0) {
            numberOfNextContainer =  Number($("#ingredientsArray").children().last().attr("id").split("-")[1]) + 1;
        } else {
            numberOfNextContainer = 0;
        }
        $('#ingredientsArray').append(
            `<div id="box-${numberOfNextContainer}" class="row row-style">
                <input type="text" class="form-control  col-6" id="selected-ingredient-${numberOfNextContainer}" value="${ingredient.name}" disabled>
                <input type="text" class="form-control  col-6" id="selected-ingredient-id-${numberOfNextContainer}" name="ingredients[ingredient${numberOfNextContainer}][id]" hidden value="${ingredient.id}">
                <input type="number" class="form-control  col-3" name = "ingredients[ingredient${numberOfNextContainer}][amount]" id="ingredient-amount-${numberOfNextContainer}" value="${ingredient.amount}">
                <input type="text" class="form-control  col-2" id="input-${numberOfNextContainer}" disabled value="${ingredient.measure}">
                <p onclick="removeIngredientField('box-${numberOfNextContainer}')" id="add-ingredient"><b>-</b></p>
            </div>`
        );
    });
}

function addModal() {
    $("#ingredientsArray").empty();
    $('#recipe_description').val('');
    $('#modalHeadder').text('Add recipe');
    $('#img-response').text('');
    $("#image-recipe").val('');
    $("#recipe_name").val('');
}

//get logged in user rcipes and add them to the page
async function renderMyRecipes(container,filter = "") {
    const user_id = await getLoginSession();
    if (user_id || container === 'recipes-container') {
        let fetchString = '';
        if (container === 'recipes-container') {
            fetchString = `/api/recipes?size=${pageSort.size}&page=${pageSort.page}&filter=${pageSort.filter}&direction=${pageSort.direction}`;
            $(`#${container}`).empty();
            $(".recipes .sorting-paging-buttons").remove();
        } else {
            fetchString = `/api/recipes/user/${user_id}?filter=${filter}`;
        }
        const response = await fetch(fetchString);
        const result = await response.json();
        if (result.recipes && result.recipes.length) {
            result.recipes.map(recipe => {
                $(`#${container}`).append(generateRecipe(recipe,container));
                checkFavorite(recipe.id, container);
                $(`#update-icon-favorite-recipes-${recipe.id}`).css('display','none');
                $(`#update-icon-recipes-container-${recipe.id}`).css('display','none');
            });
        } else if (result.message) {
            $(`#${container}`).append(`<h2>${result.message}</h2>`);
        } else {
            $(`#${container}`).append(`<h2>Something went wrong</h2>`);
        }
        if (container === 'recipes-container') {
            $(".recipes").prepend(renderSortingPaging()).append(renderSortingPaging());
            $(`.sort-dropdown option[value="${pageSort.filter}-${pageSort.direction}"]`).attr("selected", true);
            $(`#${pageSort.filter}-${pageSort.direction}`).attr("selected", true);    
        }            
    } else {
        window.location.replace('/');
    }  
}

//render recipes automatically if on recipes page
if (window.location.pathname.match("myAccount")) {
    renderMyRecipes("your-recipes"); 
    renderMyRecipes("favorite-recipes","favorite");
}

//allow to show/hide favorite recipes
$(document).ready(function() {
    let state =0;
    $("#favorite").click(function() {
        $("#favorite-recipes").toggle(500);
        let active =  $("#spread-icon").attr("src");
        if (active === "./../global/icons/hide.png") {
            $("#spread-icon").attr("src","./../global/icons/spread.png");
        } else {
            $("#spread-icon").attr("src","./../global/icons/hide.png");
        }
    });
})

//add one field for ingredient
function addIngredientField() {
    let numberOfNextContainer;
    if ($("#ingredientsArray").children().length !== 0) {
        numberOfNextContainer =  Number($("#ingredientsArray").children().last().attr("id").split("-")[1]) + 1;
    } else {
        numberOfNextContainer = 0;
    }
    $("#ingredientsArray").append(
        `<div id="box-${numberOfNextContainer}" class="row row-style" >
            <select class="form-control col-6 ingredientsList" id="select-${numberOfNextContainer}" name='ingredients[ingredient${numberOfNextContainer}][id]' required "></select>
            <input type="number" class="form-control  col-3" name = "ingredients[ingredient${numberOfNextContainer}][amount]" id="ingredient-amount-${numberOfNextContainer}" required placeholder="Amount">
            <input type="text" class="form-control  col-2" id="input-${numberOfNextContainer}" disabled placeholder="">
            <p onclick="removeIngredientField('box-${numberOfNextContainer}')" id="add-ingredient"><b>-</b></p>                             
         </div>`
    );
    renderIngredients(`input-${numberOfNextContainer}`,`select-${numberOfNextContainer}`);  
    $(`#select-${numberOfNextContainer}`).on('change', function() {
        renderMesures(`input-${numberOfNextContainer}`,$(`#select-${numberOfNextContainer} option:selected`).val());
    });
}

//remove given ingredient container 
function removeIngredientField(boxId) {
    $(`#${boxId}`).remove();
}

//get all ingredients options for form
async function renderIngredients(inputId, selectId) {
    let fetchString = `/api/ingredients`;
    const response = await fetch(fetchString);
    const result = await response.json();    
    result.ingredients.map((ingredient,index) => {
        $(`#${selectId}`).append(`<option value="${ingredient.id}">${ingredient.name}</option>`);
        if (index === 0) {
            setMeasure(`${ingredient.measure}`, `${inputId}`);
        } 
    });
}

async function renderMesures(inputId, ingredientId){
    let fetchString = `/api/ingredients`;
    const response = await fetch(fetchString);
    const result = await response.json();    
    result.ingredients.map((ingredient,index) => {
        if (ingredient.id === Number(ingredientId)){
            $(`#${inputId}`).attr("value", ingredient.measure);
        } 
    });
}
        
//set measure according to waht we have in db and set ingredient id which we send to db to ad to table with recipes and ingredients
function setMeasure(measure, inputId) {
    $(`#${inputId}`).attr("value", measure);
}

$('#ingredientForm').on('submit', addNewIngredient);

async function addNewIngredient(e) {
    e.preventDefault();
    let form = document.getElementById('ingredientForm');
    let ingredientForm = new FormData(form);
    ingredientForm.append("measure_id", ($('#ingredientForm option:selected').val()));
    const response = await fetch(`/api/ingredients`, {
        method: 'post',
        body: ingredientForm
    });
    const result = await response.json();
    $('#ingredient-message').text(result.message);
    $('#ingredientForm').reset();
}

(async function loadMeasures() {
    let fetchString = `/api/measurements`;
    const response = await fetch(fetchString);
    const result = await response.json(); 
    if (result.message) {
        $('#ingredient-message').text(result.message);
    }
    result.measures.map(measure => {
        $('#ingredient_measure').append(`<option value="${measure.id}">${measure.name}</option>`);
    }) 
})();

//send form information to the server and dispaly return message
$('#recipeForm').on('submit', submitForm);

async function submitForm(e) {
    e.preventDefault();
    const user_id = await getLoginSession();
    let formData = new FormData(document.getElementById('recipeForm'));
    formData.append('user_id', user_id);
    let response = '';
    let result = '';
    if ($('#modalHeadder').text() === 'Add recipe') {
        let nameCheck = await recipeNameCheck(formData.get('recipe_name'));
        if (nameCheck === "Not exists") {
            response = await fetch("/api/recipes", {
                method: 'post',
                body: formData
            });
            result = await response.json();
        } else {
            result = {
                message: "Recipe name already exists."
            }
        }
    } else if ($('#modalHeadder').text() === 'Update recipe') {
        let nameCheck = await recipeNameCheck(formData.get('recipe_name'),formData.get('recipe_id'));
        if (nameCheck === "Not exists") {
            response = await fetch("/api/recipes", {
                method: 'put',
                body: formData
            });
            result = await response.json();           
        }else {
            result = {
                message: "Recipe name already exists."
            }
        }
    }
    if (result.message === "Success!") {
        $('#your-recipes').empty();
        renderMyRecipes("your-recipes");
        $('#favorite-recipes').empty();
        renderMyRecipes("favorite-recipes","favorite");
        $('#img-response').text(result.message);
    } else {
        $('#img-response').text(result.message);
    }   
}

//check if name already exists
async function recipeNameCheck(recipe_name, recipe_id = -1) {
    let fetchString = "/api/recipes";
    const response = await fetch(fetchString);
    const result = await response.json();  
    for (let recipe of result.recipes){
        if (recipe.name === recipe_name && recipe.id !== Number(recipe_id)) {
            return "Exists";
        }
    }
    return "Not exists";
}

//add/delete recipe to favorite for the user who is logged in
async function addOrDeleteFromFavorite(recipe_id, heart_id, container) {
    const user_id = await getLoginSession();
    if (user_id) {
        if ($(`#${heart_id}`).attr('src') == './../global/icons/heart.png') {
            addFavorite(recipe_id, user_id, container);
        } else {
            deleteFavorite(recipe_id, user_id, container);
        }  
    } else {
        alert("Sorry, you are not logged in.");
    }
}

//add favorite
async function addFavorite(recipe_id, user_id, container) {
    const response = await fetch(`/api/recipes/favorites`, {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({recipe_id: recipe_id, user_id: user_id})
    });
    const result = await response.json();
    if (result.message === "Like added.") {
        refresh(container);
    } else if (container !== "fridge-recipes-container") {
        $(`#${recipe_id}`).removeAttr('hidden');
        $(`#${recipe_id}`).text("Sorry, try to add the recipe to your favorites later.");
    }
}

//delete favorite
async function deleteFavorite(recipe_id, user_id, container) {
    const response = await fetch(`/api/recipes/favorites`, {
        method: 'delete',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({recipe_id: recipe_id, user_id: user_id})
    });
    const result = await response.json();
    if (result.message === "Like deleted."){
        refresh(container);
    } else if (container !== "fridge-recipes-container") {
        $(`#${recipe_id}`).removeAttr('hidden');
        $(`#${recipe_id}`).text("Sorry, try to delete the recipe from your favorites later.");
    }
}

//refresh recipes /recipe container
function refresh(container) {
    if (container === 'favorite-recipes' || container === 'your-recipes') {
        $('#your-recipes').empty();
        renderMyRecipes("your-recipes");
        $('#favorite-recipes').empty();
        renderMyRecipes("favorite-recipes", "favorite");
    } else if (container === 'flex-container') {
        renderRecipe();
    } else if (container === "fridge-recipes-container") {
        findRecipes();
    } else {
        $(`#${container}`).empty();
        renderMyRecipes(container);
    }
}

//check if recipe is liked by the user
//fetch all favorite and check if recipe id is there if yes give heart filled 
async function checkFavorite(recipe_id, container) {
    const user_id = await getLoginSession();
    let fetchString = `/api/recipes/user/${user_id}/favorite/${recipe_id}`;
    const response = await fetch(fetchString);
    const result = await response.json();
    if (result && result.includes) {
        $(`#heart-icon-${container}-${recipe_id}`).attr('src','./../global/icons/LikedHeart.png');
    }   
}