import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { MapService } from './map.service';

@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('markers')
  getMarkers() {
    return this.mapService.getMarkers();
  }

  @Patch('markers/:markerId/notes')
  updateMarkerNotes(
    @Param('markerId') markerId: string,
    @Body() dto: { action: 'add_plus' | 'add_minus' | 'remove_plus' | 'remove_minus'; text: string },
  ) {
    return this.mapService.updateMarkerNotes(markerId, dto.action, dto.text);
  }
}
