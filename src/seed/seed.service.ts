import { Injectable } from '@nestjs/common';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';
import { PokemonService } from 'src/pokemon/pokemon.service';
import { PokeResponse } from './interfaces/poke-response.interface';

@Injectable()
export class SeedService {

  constructor(
    private readonly pokemonService: PokemonService,
    private readonly http: AxiosAdapter
  ){}
  
  public async executeSeed() {
    const data = await this.http.get<PokeResponse>("https://pokeapi.co/api/v2/pokemon?limit=600");
    await this.pokemonService.removeAll();

    const pokemonToInsert: { name: string, no:number }[] = [];

    data.results.forEach(({name, url}) => {
      const segments = url.split('/');
      const no: number = +segments[segments.length - 2];

      pokemonToInsert.push({name, no});
    });

    await this.pokemonService.createMany(pokemonToInsert);

    return "Seed executed";
  }

}
