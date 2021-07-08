import { Router } from 'express';

import routesAuth from './routesAuth';
import routesDashboard from './routesDashboard';
import routesCampanhas from './routesCampanhas';
import routesDiscador from './routesDiscador';
import routesGravacoes from './routesGravacoes';
import routesReports from './routesReports';
import routesAsterisk from './routesAsterisk';
import routesConfig from './routesConfig';

const routes = Router();

routesAuth(routes)
routesDashboard(routes)
routesCampanhas(routes)
routesDiscador(routes)
routesGravacoes(routes)
routesReports(routes)
routesAsterisk(routes)
routesConfig(routes)

export default routes;