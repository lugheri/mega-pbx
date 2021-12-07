import DashboardController    from '../controllers/DashboardController';

module.exports = (routes) => {

    routes.get('/fraseologia/:all',DashboardController.fraseologia)
}