async function renderRecipe() {
    const user_id = await getLoginSession();
    let fetchString = `/api${window.location.pathname}`;
    let response = await fetch(fetchString);
    let result = await response.json();
    $(".flex-container").empty();
    if (result.message) {
        $(".flex-container").append(`<h1 class="page-title" >${result.message}</h1>`);
    }
    $(".flex-container").append(
        `<div>
            <h1 class="page-title" >${result.recipe.name}  
            <img onclick="addOrDeleteFromFavorite(${result.recipe.id}, 'heart-icon-flex-container-${result.recipe.id}','flex-container')" id="heart-icon-flex-container-${result.recipe.id}" class="icon" src="./../global/icons/heart.png" alt="heart icon"></img>
            <p class="likes">${result.recipe.likes}</p></h1>
        </div>`
    );
    checkFavorite(result.recipe.id, 'flex-container');
    $(".flex-container").append(
        `<div id ="recipe-container" class="row">
            <div id="img-container" class="col-12 col-lg-8"></div>
            <div id="ingredients" class="col-12 col-lg-4"></div>
        </div>`
    );
    $('#img-container').css('background-image', `url(./../global/images/${result.recipe.img}.jpg)`);
    $("#ingredients").append(`<h3 class="ingredients-headder">Ingredients List</h3><table class="table table-hover"><tbody></tbody></table>`);
    for(const i in result.ingredients) {
        $(".table").append(
            `<tr>
                <th scope="col">${ result.ingredients[i].name}</th>
                <th scope="col">${ result.ingredients[i].amount}</th>
                <th scope="col">${ result.ingredients[i].measure}</th>
            </tr>`
        )
    }
    $(".flex-container").append(
        `<div id = "descripton">
            <h3 class="description-headder">Method</h3>
        </div>`
    );
    result.recipe.description.split(".").forEach(line => {
        $("#descripton").append(`<p>${line}.</p>`)
    });

    $(".flex-container").append(
        `<div id = "comments">
            <h3 class="description-headder">Comments</h3>
        </div>`
    );

    if (user_id) {
        $("#comments").append(
            `<textarea id="comment-area" maxlength="255" placeholder="Write your comment here"></textarea>
            <button id="submit-comment-button" class="btn btn-primary" onClick="addComment(${result.recipe.id}, ${user_id})">SUBMIT</button>`
        );
    }

    fetchString = `/api/comments/${result.recipe.id}`;
    response = await fetch(fetchString);
    result = await response.json();

    if (result.comments) {
        result.comments.map((comment) => {
            $("#comments").append(renderComment(comment, user_id))
        });
    } else {
        $("#comments").append(`<p>${result.message}</p>`);
    }
}

function renderComment(comment, user_id) {
    let response = (
        `<div class="comment">
            <h4 class="comment-user">${comment.username}</h4>`
    );
    if (user_id === comment.user_id) {
        response += `<img onclick="deleteComment(${comment.id})" class="icon delete-icon" src="./../global/icons/delete.png" alt="delete icon"></img> `;
    }

    response += (
        `<p class="comment-text">${comment.comment}</p>
    </div>`
    );
    return response;
}

async function addComment(id, user_id) {
    let comment = document.getElementById("comment-area").value;
    const fetchString = `/api/comments`;
    const response = await fetch(fetchString, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({recipe_id: id, user_id: user_id, comment: comment})
    });
    result = await response.json();
    location.reload();
}

async function deleteComment(id) {
    const fetchString = `/api/comments/${id}`;
    const response = await fetch(fetchString, {
        method: 'DELETE'
    });
    const result = await response.json();
    location.reload();
}

$(document).ready(function() { 
    renderRecipe();
});