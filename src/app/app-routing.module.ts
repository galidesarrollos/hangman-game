import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { StartComponent } from './components/start/start.component';
import { LevelComponent } from './components/level/level.component';
import { GameComponent } from './components/game/game.component';
import { TermsComponent } from './components/terms/terms.component';


const routes: Routes = [
  {
    path: '',
    component: StartComponent
  },
  { path: 'level/:theme', component: LevelComponent },
  { path: 'game/:theme/:level', component: GameComponent },
  { path: 'terminos-y-condiciones', component: TermsComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
