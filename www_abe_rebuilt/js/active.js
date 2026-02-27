function onSubmit(token) {
    document.getElementById("volunteerForm").submit();
}


function submitForm(event) {
    event.preventDefault(); // Prevents the form's default submission

    const formData = new FormData(document.getElementById('applicationForm'));

    // Continue with any other form processing or AJAX request here
    console.log("Form submitted", formData);
}




// async function submitForm() {
//     try {
//         let response = await fetch('submit_application.php', {
//             method: 'POST',
//             body: formData
//         });
//         let data = await response.json();
//         console.log('Success:', data);
//     } catch (error) {
//         console.error('Error:', error); // Catching the error
//     }
// }
// submitForm();


// function submitForm(event) {
//     event.preventDefault();  // Prevent the default form submission behavior

//     // Create the form data object (if not already created)
//     const formData = new FormData(document.querySelector('form'));

//     // Log or use formData
//     console.log(formData); // To check if formData is defined

//     // Continue with your AJAX submission logic
// }





$('#counter-block').ready(function() {
    $('.client').owlCarousel({
        loop: true,
        margin: 10,
        nav: true,
        items: 1,
        autoplayTimeout: 6000,
        autoplay: true,
        navText: [
            "<i class=\"fa fa-angle-left\" aria-hidden=\"true\"></i>",
            "<i class=\"fa fa-angle-right\" aria-hidden=\"true\"></i>"
        ],
    });

    $('.our-objective').owlCarousel({
        loop: true,
        margin: 50,
        nav: true,
        items: 3,
        autoplayTimeout: 6000,
        autoplay: true,
        navText: [
            "<i class=\"fa fa-angle-left\" aria-hidden=\"true\"></i>",
            "<i class=\"fa fa-angle-right\" aria-hidden=\"true\"></i>"
        ],
        responsive: {
            992: {
                items: 3,
                nav: true,
                loop: true
            },
            500: {
                items: 2,
                nav: true,
                loop: true
            },
            0: {
                items: 1,
                nav: true,
                loop: true
            }
        },
    });

    $('.donors_featured').owlCarousel({
        loop: true,
        margin: 10,
        nav: true,
        items: 1,
        autoplayTimeout: 6000,
        autoplay: true,
        navText: [
            "<i class=\"fa fa-angle-left\" aria-hidden=\"true\"></i>",
            "<i class=\"fa fa-angle-right\" aria-hidden=\"true\"></i>"
        ],
    });

    $('.volunteer_single').owlCarousel({
        loop: true,
        margin: 10,
        nav: true,
        items: 3,
        autoplayTimeout: 6000,
        autoplay: true,
        navText: [
            "<i class=\"fa fa-angle-left\" aria-hidden=\"true\"></i>",
            "<i class=\"fa fa-angle-right\" aria-hidden=\"true\"></i>"
        ],
        responsive: {
            1400: {
                items: 3,
                nav: true,
                loop: true
            },
            768: {
                items: 2,
                nav: true,
                loop: true
            },
            500: {
                items: 2,
                nav: true,
                loop: true
            },
            0: {
                items: 1,
                nav: true,
                loop: true
            }
        },
    });

    $('.carosal_volunteer_single').owlCarousel({
        loop: true,
        margin: 10,
        nav: true,
        items: 1,
        autoplayTimeout: 6000,
        autoplay: true,
        navText: [
            "<i class=\"fa fa-angle-left\" aria-hidden=\"true\"></i>",
            "<i class=\"fa fa-angle-right\" aria-hidden=\"true\"></i>"
        ],
    });

    $('.footer_carosal_icon').owlCarousel({
        loop: true,
        margin: 10,
        nav: true,
        items: 5,
        autoplayTimeout: 6000,
        autoplay: true,
        navText: [
            "<i class=\"fa fa-angle-left\" aria-hidden=\"true\"></i>",
            "<i class=\"fa fa-angle-right\" aria-hidden=\"true\"></i>"
        ],
        responsive: {
            1400: {
                items: 5,
                nav: true,
                loop: true
            },
            991: {
                items: 4,
                nav: true,
                loop: true
            },
            768: {
                items: 4,
                nav: true,
                loop: true
            },
            500: {
                items: 3,
                nav: true,
                loop: true
            },
            0: {
                items: 2,
                nav: true,
                loop: true
            }
        },
    });


    $('.fb').animationCounter({
        start: 0,
        end: 15000,
        step: 2,
        delay: 300
    });
    $('.bike').animationCounter({
        start: 0,
        end: 7500,
        step: 1,
        delay: 300,
    });
    $('.code').animationCounter({
        start: 0,
        end: 22500,
        step: 3,
        delay: 300,
    });
    $('.coffee').animationCounter({
        start: 0,
        end: 30000,
        step: 4,
        delay: 300,
    });
});



let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');
const logo = document.querySelector('#logo');
const title = document.querySelector('#title');
const navLinks = document.querySelectorAll('.navbar-nav__link');


window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop) {
        // Scrolling down
        navbar.classList.add('shrink');
        logo.classList.add('shrink');
        title.classList.add('shrink');
        navLinks.forEach(link => link.classList.add('shrink'))

    } else {
        // Scrolling up
        navbar.classList.remove('shrink');
        logo.classList.remove('shrink');
        title.classList.remove('shrink');
        navbar.classList.remove('shrink');
        navLinks.forEach(link => link.classList.remove('shrink'))

    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // Prevent negative scroll
});



//update footer year automatically
document.getElementById("year").textContent = new Date().getFullYear();