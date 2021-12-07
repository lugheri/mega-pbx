import { Router } from 'express';

import routesApi from './routesApi'
import routesAuth from './routesAuth';
import routesClients from './routesClients';
import routesDashboard from './routesDashboard';
import routesCampanhas from './routesCampanhas';
import routesDiscador from './routesDiscador';
import routesAgente from './routesAgente';
import routesGravacoes from './routesGravacoes';
import routesReports from './routesReports';
import routesAsterisk from './routesAsterisk';
import routesConfig from './routesConfig';
import routesTests from './routesTests';

const routes = Router();

routesApi(routes)
routesAuth(routes)
routesClients(routes)
routesDashboard(routes)
routesCampanhas(routes)
routesDiscador(routes)
routesAgente(routes)
routesGravacoes(routes)
routesReports(routes)
routesAsterisk(routes)
routesConfig(routes)
routesTests(routes)

export default routes;