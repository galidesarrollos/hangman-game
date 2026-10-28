import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StartComponent } from './components/start/start.component';
import { LevelComponent } from './components/level/level.component';
import { GameComponent } from './components/game/game.component';
import { TermsComponent } from './components/terms/terms.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { ThemeSelectorComponent } from './components/theme-selector/theme-selector.component';


const routes: Routes = [
  {
    path: '',
    component: StartComponent
  },
  { path: 'level/:theme', component: LevelComponent },
  { path: 'tematicas', component: ThemeSelectorComponent },
  { path: 'game/:theme/:level', component: GameComponent },
  { path: 'reto-diario', component: GameComponent },
  { path: 'contrarreloj', component: GameComponent },
  { path: 'terminos-y-condiciones', component: TermsComponent },
  { path: 'politica-privacidad', component: PrivacyComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
